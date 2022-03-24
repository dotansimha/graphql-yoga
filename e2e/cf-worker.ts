import { Stack } from '@pulumi/pulumi/automation'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { DeploymentConfiguration } from './types'
import * as cf from '@pulumi/cloudflare'
import { assertGraphiQL, assertQuery, env } from './utils'
import * as pulumi from '@pulumi/pulumi'

export const cloudFlareDeployment: DeploymentConfiguration<{
  workerUrl: string
}> = {
  prerequisites: async (stack: Stack) => {
    // Intall Pulumi CF Plugin
    await stack.workspace.installPlugin('cloudflare', '4.3.0', 'resource')

    // Build and bundle the worker
    execSync('yarn build', {
      cwd: '../examples/cloudflare-worker',
      stdio: 'inherit',
    })
  },
  config: async (stack: Stack) => {
    // Configure the Pulumi environment with the CloudFlare credentials
    await stack.setConfig('cloudflare:apiToken', {
      value: env('CLOUDFLARE_API_TOKEN'),
    })
    await stack.setConfig('cloudflare:accountId', {
      value: env('CLOUDFLARE_ACCOUNT_ID'),
    })
  },
  program: async () => {
    const stackName = pulumi.getStack()
    const workerName = `yoga-worker-e2e-${stackName}`
    const workerUrl = `e2e.graphql-yoga.com/${workerName}`

    // Deploy CF script as Worker
    const workerScript = new cf.WorkerScript('worker', {
      content: readFileSync(
        '../examples/cloudflare-worker/dist/index.js',
        'utf-8',
      ),
      secretTextBindings: [
        {
          name: 'GRAPHQL_ROUTE',
          text: `/${workerName}`,
        },
      ],
      name: workerName,
    })

    const workerRoute = new cf.WorkerRoute('worker-route', {
      scriptName: workerScript.name,
      pattern: workerUrl,
      // This is graphlq-yoga.com in CF
      zoneId: 'aa8c5edd66b499ee94821c9263a636e6',
    })

    return {
      workerUrl: `https://${workerUrl}`,
    }
  },
  test: async ({ workerUrl }) => {
    console.log(`CF Worker URL: ${workerUrl.value}`)
    await assertGraphiQL(workerUrl.value)
    await assertQuery(workerUrl.value)
  },
}
