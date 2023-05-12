import { DeploymentConfiguration } from '../types'
import {
  assertGraphiQL,
  assertQuery,
  env,
  execPromise,
  waitForEndpoint,
} from '../utils'
import * as docker from '@pulumi/docker'
import { interpolate } from '@pulumi/pulumi'
import * as awsx from '@pulumi/awsx'
import { resolve } from 'path'
import { Stack } from '@pulumi/pulumi/automation'

export const nextJSDeployment = (
  image: string,
): DeploymentConfiguration<{
  endpoint: string
}> => ({
  prerequisites: async () => {
    await execPromise('pnpm build', {
      cwd: '../examples/nextjs-app',
    })
  },
  config: async (stack: Stack) => {
    // Configure the Pulumi environment with the AWS credentials
    // This will allow Pulummi program to just run without caring about secrets/configs.
    // See: https://www.pulumi.com/registry/packages/aws/installation-configuration/
    await stack.setConfig('aws:accessKey', {
      value: env('AWS_ACCESS_KEY'),
    })
    await stack.setConfig('aws:secretKey', {
      value: env('AWS_SECRET_KEY'),
    })
    await stack.setConfig('aws:region', {
      value: env('AWS_REGION'),
    })
    await stack.setConfig('aws:allowedAccountIds', {
      value: `[${env('AWS_ACCOUNT_ID')}]`,
    })
  },
  program: async () => {
    const listener = new awsx.elasticloadbalancingv2.NetworkListener('node', {
      port: 80,
    })

    const service = new awsx.ecs.FargateService('node', {
      desiredCount: 2,
      taskDefinitionArgs: {
        containers: {
          nginx: {
            image: awsx.ecs.Image.fromPath('node', '../examples/nextjs-app'),
            memory: 512,
            portMappings: [listener],
          },
        },
      },
    })

    return {
      endpoint: interpolate`http://${listener.endpoint.hostname}/api/graphql`,
    }
  },
  test: async ({ endpoint }) => {
    console.log(`ℹ️ Docker container deployed to URL: ${endpoint.value}`)
    await waitForEndpoint(endpoint.value, 5, 10000)
    await assertGraphiQL(endpoint.value)
    await assertQuery(endpoint.value)
  },
})
