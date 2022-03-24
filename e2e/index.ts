import { InlineProgramArgs, LocalWorkspace } from '@pulumi/pulumi/automation'
import { cloudFlareDeployment } from './cf-worker'
import { DeploymentConfiguration } from './types'
import { env, getCommitId } from './utils'

const AVAILABLE_TEST_PLANS = {
  'cf-worker': cloudFlareDeployment,
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
    console.info('\tℹ️ Installing Pulumi plugins...')
    await testPlan.prerequisites(stack)
    console.info('\t✅ Plugins installed')
    console.info('\tℹ️ Setting up Pulumi config...')
    await testPlan.config(stack)
    console.info('\t✅ Pulumi configuratio is now set')
    // console.info('refreshing stack...')
    // await stack.refresh({ onOutput: console.info })
    // console.info('refresh complete')
    console.info('ℹ️ Running Pulumi program...')
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
    await stack.destroy()
    console.info('✅ Destroy done')
  }
}

const commitId = getCommitId()
const testPlaneName = env('TEST_PLAN_NAME')
const testPlaneId = `${testPlaneName}-e2e-${commitId}`
const testPlane = AVAILABLE_TEST_PLANS[testPlaneName]

if (!testPlane) {
  throw new Error(`Test plan ${testPlaneName} not found`)
}

run(testPlaneId, testPlaneName, testPlane).catch((err) => {
  console.error(err)
  process.exit(1)
})
