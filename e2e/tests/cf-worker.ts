import { Stack } from '@pulumi/pulumi/automation'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { DeploymentConfiguration } from '../types'
import * as cf from '@pulumi/cloudflare'
import { assertGraphiQL, assertQuery, env } from '../utils'
import * as pulumi from '@pulumi/pulumi'

export const cloudFlareDeployment: DeploymentConfiguration<{
  workerUrl: string
}> = {
  prerequisites: async (stack: Stack) => {
    console.info('\t\tℹ️ Installing Pulumi CF plugin...')
    // Intall Pulumi CF Plugin
    await stack.workspace.installPlugin('cloudflare', '4.3.0', 'resource')

    // Build and bundle the worker
    console.info('\t\tℹ️ Bundling the CF Worker....')
    execSync('yarn build', {
      cwd: '../examples/cloudflare-worker',
      stdio: 'inherit',
    })
  },
  config: async (stack: Stack) => {
    // Configure the Pulumi environment with the CloudFlare credentials
    // This will allow Pulummi program to just run without caring about secrets/configs.
    // See: https://www.pulumi.com/registry/packages/cloudflare/installation-configuration/
    await stack.setConfig('cloudflare:apiToken', {
      value: env('CLOUDFLARE_API_TOKEN'),
    })
    await stack.setConfig('cloudflare:accountId', {
      value: env('CLOUDFLARE_ACCOUNT_ID'),
    })
  },
  program: async () => {
    const stackName = pulumi.getStack()
    const workerUrl = `e2e.graphql-yoga.com/${stackName}`

    // Deploy CF script as Worker
    const workerScript = new cf.WorkerScript('worker', {
      content: readFileSync(
        '../examples/cloudflare-worker/dist/index.js',
        'utf-8',
      ),
      secretTextBindings: [
        {
          name: 'GRAPHQL_ROUTE',
          text: `/${stackName}`,
        },
      ],
      name: stackName,
    })

    // Create a nice route for easy testing
    new cf.WorkerRoute('worker-route', {
      scriptName: workerScript.name,
      pattern: workerUrl,
      zoneId: env('CLOUDFLARE_ZONE_ID'),
    })

    return {
      workerUrl: `https://${workerUrl}`,
    }
  },
  test: async ({ workerUrl }) => {
    console.log(`ℹ️ CloudFlare Worker deployed to URL: ${workerUrl.value}`)
    await assertGraphiQL(workerUrl.value)
    await assertQuery(workerUrl.value)
  },
}
