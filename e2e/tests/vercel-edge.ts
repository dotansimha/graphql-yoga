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
import { VercelDeployment } from './vercel'

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
    const deployment = new VercelDeployment('vercel-edge-function', {
      files: [
        {
          file: '/api/graphql.js',
          data: await fsPromises.readFile(
            '../examples/nextjs-edge/dist/index.js',
            'utf-8',
          ),
        },
      ],
      name: `yoga-e2e-testing`,
      functions: {
        'api/graphql.js': {
          runtime: 'edge',
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
