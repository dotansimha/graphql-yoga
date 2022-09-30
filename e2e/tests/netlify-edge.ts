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

type ProviderInputs = {
  name: string
  files: {
    file: string
    data: string
  }[]
}

type NetlifyDeploymentInputs = {
  [K in keyof ProviderInputs]: pulumi.Input<ProviderInputs[K]>
}

class NetlifyProvider implements pulumi.dynamic.ResourceProvider {
  private baseUrl = 'https://api.netlify.com/api/'
  private authToken = env('NETLIFY_AUTH_TOKEN')

  async delete(id: string) {
    const response = await fetch(`${this.baseUrl}/v1/sites/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.authToken}`,
      },
    })

    // https://open-api.netlify.com/#tag/site/operation/deleteSite
    if (response.status !== 204) {
      throw new Error(
        `Failed to delete Netlify site deployment ${id}: invalid status code (${
          response.status
        }), body: ${await response.text()}`,
      )
    }
  }

  async create(inputs: ProviderInputs): Promise<pulumi.dynamic.CreateResult> {
    // First we create a site
    const createSiteResponse = await fetch(`${this.baseUrl}/v1/sites`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${this.authToken}`,
      },
      body: JSON.stringify({
        name: inputs.name,
      }),
    })

    // https://open-api.netlify.com/#tag/site/operation/createSite
    if (createSiteResponse.status !== 201) {
      throw new Error(
        `Failed to create Netlify deployment: invalid status code (${
          createSiteResponse.status
        }), body: ${await createSiteResponse.text()}`,
      )
    }

    const createResponseJson = await createSiteResponse.json()
    const siteId = createResponseJson.id

    const createDeploymentResponse = await fetch(
      `${this.baseUrl}/v1/sites/${siteId}/deploys`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          files: inputs.files,
        }),
      },
    )

    // https://open-api.netlify.com/#tag/deploy/operation/createSiteDeploy
    if (createDeploymentResponse.status !== 200) {
      throw new Error(
        `Failed to create Netlify deployment: invalid status code (${
          createDeploymentResponse.status
        }), body: ${await createDeploymentResponse.text()}`,
      )
    }

    const createDeploymentResponseJson = await createDeploymentResponse.json()

    return {
      id: createDeploymentResponseJson['site_id'],
      outs: {
        url: createDeploymentResponseJson['deploy_ssl_url'],
      },
    }
  }
}

export class NetlifyDeployment extends pulumi.dynamic.Resource {
  public readonly url: pulumi.Output<string>

  constructor(
    name: string,
    props: NetlifyDeploymentInputs,
    opts?: pulumi.CustomResourceOptions,
  ) {
    super(
      new NetlifyProvider(),
      name,
      {
        url: undefined,
        ...props,
      },
      opts,
    )
  }
}

export const netlifyDeployment: DeploymentConfiguration<{
  functionUrl: string
}> = {
  prerequisites: async () => {
    // Build and bundle the function
    console.info('\t\tℹ️ Bundling the Netlify Function....')
    await execPromise('yarn build', {
      cwd: '../examples/netlify-edge',
    })
  },
  program: async () => {
    const deployment = new NetlifyDeployment('netlify-function', {
      files: [
        // {
        //   file: '/api/graphql.js',
        //   data: await fsPromises.readFile(
        //     '../examples/nextjs/dist/index.js',
        //     'utf-8',
        //   ),
        // },
      ],
      name: `yoga-e2e-testing`,
    })

    return {
      functionUrl: pulumi.interpolate`${deployment.url}/api/graphql`,
    }
  },
  test: async ({ functionUrl }) => {
    console.log(`ℹ️ Netlify Function deployed to URL: ${functionUrl.value}`)
    // await waitForEndpoint(functionUrl.value, 5, 10000)
    // await assertGraphiQL(functionUrl.value)
    // await assertQuery(functionUrl.value)
  },
}
