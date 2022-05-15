import * as pulumi from '@pulumi/pulumi'
import { assertGraphiQL, assertQuery, env, waitForEndpoint } from '../utils'
import { request } from 'undici'
import { DeploymentConfiguration } from '../types'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'

type VercelProviderInputs = {
  name: string
  files: {
    file: string
    data: string
  }[]
  projectSettings: {
    framework: string
  }
  functions: Record<
    string,
    {
      memory: number
      maxDuration: number
    }
  >
}

type VercelDeploymentInputs = {
  [K in keyof VercelProviderInputs]: pulumi.Input<VercelProviderInputs[K]>
}

class VercelProvider implements pulumi.dynamic.ResourceProvider {
  private baseUrl = 'https://api.vercel.com'
  private authToken = env('VERCEL_AUTH_TOKEN')

  private getTeamId(): string | null {
    try {
      return env('VERCEL_TEAM_ID')
    } catch {
      return null
    }
  }

  async delete(id: string) {
    const teamId = this.getTeamId()
    const { statusCode, body } = await request(
      `${this.baseUrl}/v13/deployments/${id}${
        teamId ? `?teamId=${teamId}` : ''
      }`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
        headersTimeout: 20 * 1000,
        bodyTimeout: 20 * 1000,
      },
    )

    if (statusCode !== 200) {
      throw new Error(
        `Failed to delete Vercel deployment: invalid status code (${statusCode}), body: ${await body.text()}`,
      )
    }
  }

  async create(
    inputs: VercelProviderInputs,
  ): Promise<pulumi.dynamic.CreateResult> {
    const teamId = this.getTeamId()
    const { statusCode, body } = await request(
      `${this.baseUrl}/v13/deployments${teamId ? `?teamId=${teamId}` : ''}`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          name: inputs.name,
          files: inputs.files,
          functions: inputs.functions,
          projectSettings: inputs.projectSettings,
        }),
        headersTimeout: 20 * 1000,
        bodyTimeout: 20 * 1000,
      },
    )

    if (statusCode !== 200) {
      throw new Error(
        `Failed to create Vercel deployment: invalid status code (${statusCode}), body: ${await body.text()}`,
      )
    }

    const response = await body.json()

    return {
      id: response.id,
      outs: {
        url: response.url,
      },
    }
  }
}

export class VercelDeployment extends pulumi.dynamic.Resource {
  public readonly url: pulumi.Output<string>

  constructor(
    name: string,
    props: VercelDeploymentInputs,
    opts?: pulumi.CustomResourceOptions,
  ) {
    super(
      new VercelProvider(),
      name,
      {
        url: undefined,
        ...props,
      },
      opts,
    )
  }
}

export const vercelDeployment: DeploymentConfiguration<{
  functionUrl: string
}> = {
  prerequisites: async () => {
    // Build and bundle the function
    console.info('\t\tℹ️ Bundling the Vercel Function....')
    execSync('yarn build', {
      cwd: '../examples/vercel-function',
      stdio: 'inherit',
    })
  },
  program: async () => {
    const deployment = new VercelDeployment('vercel-function', {
      files: [
        {
          file: '/api/graphql.js',
          data: readFileSync(
            '../examples/vercel-function/dist/index.js',
            'utf-8',
          ),
        },
      ],
      name: `yoga-e2e-testing`,
      functions: {
        'api/graphql.js': {
          memory: 256,
          maxDuration: 5,
        },
      },
      projectSettings: {
        framework: null,
      },
    })

    return {
      functionUrl: pulumi.interpolate`https://${deployment.url}/api/graphql`,
    }
  },
  test: async ({ functionUrl }) => {
    console.log(`ℹ️ Vercel Function deployed to URL: ${functionUrl.value}`)
    await waitForEndpoint(functionUrl.value, 5, 10000)
    await assertGraphiQL(functionUrl.value)
    await assertQuery(functionUrl.value)
  },
}
