import * as pulumi from '@pulumi/pulumi'
import {
  assertGraphiQL,
  assertQuery,
  env,
  execPromise,
  fsPromises,
  waitForEndpoint,
} from '../utils'
import { DeploymentConfiguration } from '../types'

type VercelProviderInputs = {
  name: string
  files: {
    file: string
    data: string
  }[]
  projectSettings: {}
  version: 2
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
    const response = await fetch(
      `${this.baseUrl}/v13/deployments/${id}${
        teamId ? `?teamId=${teamId}` : ''
      }`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
      },
    )

    if (response.status !== 200) {
      throw new Error(
        `Failed to delete Vercel deployment: invalid status code (${
          response.status
        }), body: ${await response.text()}`,
      )
    }
  }

  async create(
    inputs: VercelProviderInputs,
  ): Promise<pulumi.dynamic.CreateResult> {
    const teamId = this.getTeamId()
    const response = await fetch(
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
          projectSettings: inputs.projectSettings,
        }),
      },
    )

    if (response.status !== 200) {
      throw new Error(
        `Failed to create Vercel deployment: invalid status code (${
          response.status
        }), body: ${await response.text()}`,
      )
    }

    const responseJson = await response.json()

    return {
      id: responseJson.id,
      outs: {
        url: responseJson.url,
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

export const vercelEdgeDeployment: DeploymentConfiguration<{
  functionUrl: string
}> = {
  prerequisites: async () => {
    // Build and bundle the function
    console.info('\t\tℹ️ Bundling the Vercel Function....')
    await execPromise('pnpm bundle', {
      cwd: '../examples/nextjs-edge',
    })
  },
  program: async () => {
    const nextJSVersion = JSON.parse(
      (
        await fsPromises.readFile('../examples/nextjs-edge/package.json')
      ).toString('utf-8'),
    )['dependencies']['next']

    if (nextJSVersion == null || Number.isNaN(parseInt(nextJSVersion[0], 10))) {
      throw new Error(`Failed to parse Next.js version from package.json.`)
    }

    const deployment = new VercelDeployment('vercel-edge', {
      version: 2,
      files: [
        {
          file: '.vercel/output/functions/api/graphql.func/index.js',
          data: await fsPromises.readFile(
            '../examples/nextjs-edge/dist/index.js',
            'utf-8',
          ),
        },
        {
          file: '.vercel/output/functions/api/graphql.func/.vc-config.json',
          data: JSON.stringify({
            runtime: 'edge',
            name: 'api/graphql',
            deploymentTarget: 'v8-worker',
            entrypoint: 'index.js',
            envVarsInUse: [],
            assets: [],
            framework: {
              slug: 'nextjs',
              version: nextJSVersion,
            },
          }),
        },
      ],
      name: `yoga-e2e-testing`,
      projectSettings: {},
    })

    return {
      functionUrl: pulumi.interpolate`https://${deployment.url}/api/graphql`,
    }
  },
  test: async ({ functionUrl }) => {
    console.log(`ℹ️ Vercel Edge Function deployed to URL: ${functionUrl.value}`)
    await waitForEndpoint(functionUrl.value, 5, 10000)
    await assertGraphiQL(functionUrl.value)
    await assertQuery(functionUrl.value)
  },
}
