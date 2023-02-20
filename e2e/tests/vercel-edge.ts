import * as pulumi from '@pulumi/pulumi'
import * as fs from 'fs/promises'
import * as path from 'path'
import execa = require('execa')
import {
  assertGraphiQL,
  assertQuery,
  env,
  fsPromises,
  waitForEndpoint,
} from '../utils'
import { DeploymentConfiguration } from '../types'

type VercelDeploymentInputs = {}

class VercelProvider implements pulumi.dynamic.ResourceProvider {
  private baseUrl = 'https://api.vercel.com'
  private authToken = env('VERCEL_AUTH_TOKEN')
  private directory = path.resolve(__dirname, '..', 'examples', 'nextjs-edge')

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

  async create(): Promise<pulumi.dynamic.CreateResult> {
    // Create project
    const teamId = this.getTeamId()

    const url = new URL(`${this.baseUrl}/v9/projects`)
    url.searchParams.set('teamId', teamId)

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.authToken}`,
      },
      body: JSON.stringify({
        name: new Date().toISOString(),
        framework: 'nextjs',
      }),
    })

    await pulumi.log.info(`Create deployment (status=${response.status})`)

    if (response.status !== 200) {
      throw new Error(
        `Failed to create Vercel deployment: invalid status code (${
          response.status
        }), body: ${await response.text()}`,
      )
    }

    const responseJson: {
      id: string
      // url: string
    } = await response.json()

    // Deploy project
    await fs.rmdir(path.join(this.directory, '.vercel'), {
      recursive: true,
      // @ts-expect-error
      force: true,
    })

    await fs.mkdir(path.join(this.directory, '.vercel'))

    await fs.writeFile(
      path.join(this.directory, '.vercel', 'project.json'),
      JSON.stringify({
        projectId: responseJson.id,
        // TODO: figure out how we can `orgId` without inlining it.
        orgId: this.getTeamId(),
        settings: {
          createdAt: 1677572115659,
          framework: 'nextjs',
          devCommand: null,
          installCommand: null,
          buildCommand: null,
          outputDirectory: null,
          rootDirectory: null,
          directoryListing: false,
          nodeVersion: '18.x',
        },
      }),
    )

    await execa('pnpm', ['run', 'end2end:build'], {
      cwd: this.directory,
    })

    const deployment = await execa('pnpm', ['run', 'end2end:deploy'], {
      cwd: this.directory,
    })

    const regex = /\n✅  Production: (https:\/\/.*.vercel.app) \[/

    const result = deployment.all?.match(regex)

    if (!Array.isArray(result)) {
      pulumi.log.info("Couldn't find deployment URL in output.")
      throw new Error("Couldn't find deployment URL in output.")
    }

    const deploymentUrl = result[1]

    return {
      id: responseJson.id,
      outs: {
        url: deploymentUrl,
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
  program: async () => {
    const deployment = new VercelDeployment('vercel-edge', {})

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
