import { Stack } from '@pulumi/pulumi/automation'
import { DeploymentConfiguration } from '../types'
import { assertGraphiQL, assertQuery, env, execPromise } from '../utils'
import * as pulumi from '@pulumi/pulumi'
import * as resources from '@pulumi/azure-native/resources'
import * as storage from '@pulumi/azure-native/storage'
import * as web from '@pulumi/azure-native/web'
import * as containerregistry from '@pulumi/azure-native/containerregistry'
import * as docker from '@pulumi/docker'
import { version } from '@pulumi/azure-native/package.json'

export const nextJSAzureDeployment: DeploymentConfiguration<{
  endpoint: string
}> = {
  prerequisites: async (stack: Stack) => {
    await execPromise('pnpm build', {
      cwd: '../examples/nextjs-app',
    })
  },
  config: async (stack: Stack) => {
    // Configure the Pulumi environment with the Azure credentials
    // This will allow Pulummi program to just run without caring about secrets/configs.
    // See: https://www.pulumi.com/registry/packages/azure-native/installation-configuration/
    await stack.setConfig('azure-native:clientId', {
      value: env('AZURE_CLIENT_ID'),
    })
    await stack.setConfig('azure-native:clientSecret', {
      value: env('AZURE_CLIENT_SECRET'),
    })
    await stack.setConfig('azure-native:tenantId', {
      value: env('AZURE_TENANT_ID'),
    })
    await stack.setConfig('azure-native:subscriptionId', {
      value: env('AZURE_SUBSCRIPTION_ID'),
    })
    await stack.setConfig('azure-native:location', {
      value: 'eastus',
    })
  },
  program: async () => {
    const stackName = pulumi.getStack()
    const resourceGroup = new resources.ResourceGroup(stackName)

    const plan = new web.AppServicePlan(
      'planlinux',
      {
        resourceGroupName: resourceGroup.name,
        sku: {
          name: 'Y1',
          tier: 'Dynamic',
        },
        kind: 'Linux',
        reserved: true,
      },
      {
        deleteBeforeReplace: true,
      },
    )

    const customImage = 'nextjs-13-app'
    const registry = new containerregistry.Registry('registry', {
      resourceGroupName: resourceGroup.name,
      sku: {
        name: 'Basic',
      },
      adminUserEnabled: true,
    })

    const credentials = containerregistry.listRegistryCredentialsOutput({
      resourceGroupName: resourceGroup.name,
      registryName: registry.name,
    })

    const adminUsername = credentials.apply(
      (credentials) => credentials.username!,
    )
    const adminPassword = credentials.apply(
      (credentials) => credentials.passwords![0].value!,
    )

    const myImage = new docker.Image(customImage, {
      imageName: pulumi.interpolate`${registry.loginServer}/${customImage}:v1.0.0`,
      build: { context: `../examples/nextjs-app` },
      registry: {
        server: registry.loginServer,
        username: adminUsername,
        password: adminPassword,
      },
    })

    const app = new web.WebApp(
      'nextjs-app',
      {
        resourceGroupName: resourceGroup.name,
        serverFarmId: plan.id,
        siteConfig: {
          appSettings: [
            {
              name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE',
              value: 'false',
            },
            {
              name: 'DOCKER_REGISTRY_SERVER_URL',
              value: pulumi.interpolate`https://${registry.loginServer}`,
            },
            {
              name: 'DOCKER_REGISTRY_SERVER_USERNAME',
              value: adminUsername,
            },
            {
              name: 'DOCKER_REGISTRY_SERVER_PASSWORD',
              value: adminPassword,
            },
            {
              name: 'WEBSITES_PORT',
              value: '80', // Our custom image exposes port 80. Adjust for your app as needed.
            },
          ],

          http20Enabled: true,
          httpLoggingEnabled: true,
          linuxFxVersion: pulumi.interpolate`DOCKER|${myImage.imageName}`,
        },
        httpsOnly: true,
      },
      {
        deleteBeforeReplace: true,
      },
    )

    return {
      endpoint: pulumi.interpolate`https://${app.defaultHostName}/api/yoga`,
    }
  },
  test: async ({ endpoint }) => {
    console.log(`ℹ️ Azure Function deployed to URL: ${endpoint.value}`)
    await assertGraphiQL(endpoint.value)
    await assertQuery(endpoint.value)
  },
}
