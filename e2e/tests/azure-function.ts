import { Stack } from '@pulumi/pulumi/automation'
import { execSync } from 'child_process'
import { DeploymentConfiguration } from '../types'
import { assertGraphiQL, assertQuery, env } from '../utils'
import * as pulumi from '@pulumi/pulumi'
import * as resources from '@pulumi/azure-native/resources'
import * as storage from '@pulumi/azure-native/storage'
import * as web from '@pulumi/azure-native/web'

export function getConnectionString(
  resourceGroupName: pulumi.Input<string>,
  accountName: pulumi.Input<string>,
): pulumi.Output<string> {
  // Retrieve the primary storage account key.
  const storageAccountKeys = storage.listStorageAccountKeysOutput({
    resourceGroupName,
    accountName,
  })
  const primaryStorageKey = storageAccountKeys.keys[0].value

  // Build the connection string to the storage account.
  return pulumi.interpolate`DefaultEndpointsProtocol=https;AccountName=${accountName};AccountKey=${primaryStorageKey}`
}

export function signedBlobReadUrl(
  blob: storage.Blob,
  container: storage.BlobContainer,
  account: storage.StorageAccount,
  resourceGroup: resources.ResourceGroup,
): pulumi.Output<string> {
  const blobSAS = storage.listStorageAccountServiceSASOutput({
    accountName: account.name,
    protocols: storage.HttpProtocol.Https,
    sharedAccessExpiryTime: '2030-01-01',
    sharedAccessStartTime: '2021-01-01',
    resourceGroupName: resourceGroup.name,
    resource: storage.SignedResource.C,
    permissions: storage.Permissions.R,
    canonicalizedResource: pulumi.interpolate`/blob/${account.name}/${container.name}`,
    contentType: 'application/json',
    cacheControl: 'max-age=5',
    contentDisposition: 'inline',
    contentEncoding: 'deflate',
  })
  return pulumi.interpolate`https://${account.name}.blob.core.windows.net/${container.name}/${blob.name}?${blobSAS.serviceSasToken}`
}

export const azureFunctionDeployment: DeploymentConfiguration<{
  functionUrl: string
}> = {
  prerequisites: async (stack: Stack) => {
    console.info('\t\tℹ️ Installing Azure-Native plugin...')
    // Intall Pulumi Azure Plugin
    await stack.workspace.installPlugin('azure-native', '1.60.0', 'resource')

    // Build and bundle the worker
    console.info('\t\tℹ️ Bundling the Azure Function....')
    execSync('yarn build', {
      cwd: '../examples/azure-function',
      stdio: 'inherit',
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

    const storageAccount = new storage.StorageAccount('yogasa', {
      resourceGroupName: resourceGroup.name,
      sku: {
        name: storage.SkuName.Standard_LRS,
      },
      kind: storage.Kind.StorageV2,
    })

    const codeContainer = new storage.BlobContainer('yogazips', {
      resourceGroupName: resourceGroup.name,
      accountName: storageAccount.name,
    })

    const codeBlob = new storage.Blob('zip', {
      resourceGroupName: resourceGroup.name,
      accountName: storageAccount.name,
      containerName: codeContainer.name,
      source: new pulumi.asset.FileArchive('../examples/azure-function/dist'),
    })

    const plan = new web.AppServicePlan('planlinux', {
      resourceGroupName: resourceGroup.name,
      sku: {
        name: 'Y1',
        tier: 'Dynamic',
      },
      kind: 'Linux',
      reserved: true,
    })

    const storageConnectionString = getConnectionString(
      resourceGroup.name,
      storageAccount.name,
    )
    const codeBlobUrl = signedBlobReadUrl(
      codeBlob,
      codeContainer,
      storageAccount,
      resourceGroup,
    )

    const app = new web.WebApp('fa', {
      resourceGroupName: resourceGroup.name,
      serverFarmId: plan.id,
      kind: 'functionapp',
      siteConfig: {
        appSettings: [
          { name: 'AzureWebJobsStorage', value: storageConnectionString },
          { name: 'FUNCTIONS_EXTENSION_VERSION', value: '~3' },
          { name: 'FUNCTIONS_WORKER_RUNTIME', value: 'node' },
          { name: 'WEBSITE_NODE_DEFAULT_VERSION', value: '~14' },
          { name: 'WEBSITE_RUN_FROM_PACKAGE', value: codeBlobUrl },
        ],
        http20Enabled: true,
        httpLoggingEnabled: true,
        nodeVersion: '~14',
      },
    })

    return {
      functionUrl: pulumi.interpolate`https://${app.defaultHostName}/api/yoga`,
    }
  },
  test: async ({ functionUrl }) => {
    console.log(`ℹ️ Azure Function deployed to URL: ${functionUrl.value}`)
    // await assertGraphiQL(functionUrl.value)
    // await assertQuery(functionUrl.value)
  },
}
