import { LocalWorkspace } from '@pulumi/pulumi/automation'
import { azureFunctionDeployment } from './tests/azure-function'
import { cloudFlareDeployment } from './tests/cf-worker'
import { DeploymentConfiguration } from './types'
import { env, getCommitId } from './utils'

const AVAILABLE_TEST_PLANS = {
  'cf-worker': cloudFlareDeployment,
  'azure-function': azureFunctionDeployment,
}

async function run(
  identifier: string,
  testPlanName: string,
  testPlan: DeploymentConfiguration,
) {
  const stack = await LocalWorkspace.createOrSelectStack({
    projectName: 'yoga-e2e',
    stackName: identifier,
    program: testPlan.program,
  })

  try {
    console.info(
      `🚀 Running test plan: ${testPlanName} with identifier: ${identifier}`,
    )
    console.info(`ℹ️ Creating new temporary Pulumi environment...`)
    console.info(`\t✅ Successfully initialized stack...`)
    console.info('\tℹ️ Running prerequisites...')
    await testPlan.prerequisites(stack)
    console.info('\t✅ Done with prerequisites')
    console.info('\tℹ️ Setting up Pulumi config...')
    await testPlan.config(stack)
    console.info('\t✅ Pulumi configuration is now set')
    console.info('ℹ️ Running Pulumi program...')

    const info = await stack.info()

    console.info(`ℹ️ Current Pulumi stack status: ${info?.result}`)

    if (info?.result === 'in-progress' || info?.result === 'not-started') {
      console.info('ℹ️ Cancelling in-progress Pulumi update...', {
        version: info.version,
        startTime: info.startTime,
        result: info.result,
      })

      await stack.cancel()
    }

    await stack.destroy({ onOutput: console.log })

    process.exit(1)

    // Since we are going to deploy a fresh deployment, we don't really need to run Pulumi refresh.
    // When experimenting locally with e2e testing, this is needed to make sure to get the latest changes.
    if (!process.env.CI) {
      console.info('ℹ️ Refreshing Pulumi state...')
      await stack.refresh({ onOutput: console.log })
    }

    const upRes = await stack.up({ onOutput: console.log })
    console.log(
      `✅ Pulumi program execution done, infrastructure is now provisioned. Pulumi outputs:`,
      upRes.outputs,
    )
    console.info(`🚀 Running "${testPlanName}" tests...`)
    await testPlan.test(upRes.outputs)
    console.info('✅ Tests execution is done!')
  } catch (e) {
    console.error(`⚠️ Failed to run test plan, error: `, e)

    throw e
  } finally {
    console.info('ℹ️ Destroying stack and removing all resources...')
    await stack.destroy({ onOutput: console.log })
    console.info('✅ Destroy done')
  }
}

const commitId = getCommitId()
const testPlaneName = env('TEST_PLAN_NAME')
const testPlaneId = `yoga-${testPlaneName}-e2e-${commitId}`
const testPlane = AVAILABLE_TEST_PLANS[testPlaneName]

if (!testPlane) {
  throw new Error(`Test plan ${testPlaneName} not found`)
}

run(testPlaneId, testPlaneName, testPlane).catch((err) => {
  console.error(err)
  process.exit(1)
})
