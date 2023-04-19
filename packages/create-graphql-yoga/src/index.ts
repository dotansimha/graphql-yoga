import ora from 'ora'
import { parseArgs } from 'node:util'
import { fetch } from '@whatwg-node/fetch'
import tar from 'tar'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { existsSync, mkdirSync } from 'node:fs'

const spinner = ora()

const options = {
  template: {
    type: 'string',
    short: 't',
  },
} as const

function getRegistryAPIUrl(packageName: string, version: string) {
  return `https://registry.npmjs.org/${packageName}/${version}`
}

async function getVersionByTag(packageName: string, tag: string) {
  const url = getRegistryAPIUrl(packageName, tag)
  const response = await fetch(url)
  if (response.status === 404) {
    spinner.fail(`Package not found: ${packageName}`)
    process.exit(1)
  }
  if (!response.ok) {
    spinner.fail(
      `Failed to fetch package ${packageName} with ${
        response.status
      }: ${await response.text()}`,
    )
    process.exit(1)
  }
  const { version } = await response.json()
  return version
}

function getTarballUrl(packageName: string, version: string) {
  return `https://registry.npmjs.org/${packageName}/-/${packageName}-${version}.tgz`
}

function getPackageNameAndTagForTemplate(template: string) {
  const [suffix, tag] = template.split('@')
  return {
    packageName: `@graphql-yoga/template-${suffix}`,
    tag: tag ?? 'latest',
  }
}

export async function createGraphQLYoga(fullArgs: string[] = process.argv) {
  const args = [...fullArgs]
  while (args[0].startsWith('/') || args[0] === '--') {
    args.shift()
  }
  const {
    values: { template = 'node-ts' },
  } = parseArgs({ args, options, allowPositionals: true })
  spinner.start(`Fetching template ${template}...`)
  const { packageName, tag } = getPackageNameAndTagForTemplate(template)
  const version = await getVersionByTag(packageName, tag)
  const url = getTarballUrl(packageName, version)
  const response = await fetch(url)
  if (response.status === 404) {
    spinner.fail(`Template not found: ${template}`)
    process.exit(1)
  }
  if (!response.ok) {
    spinner.fail(
      `Failed to fetch template ${template} with ${
        response.status
      }: ${await response.text()}`,
    )
    process.exit(1)
  }
  if (!response.body) {
    spinner.fail(`Failed to fetch template ${template} with empty body`)
    process.exit(1)
  }
  const nodeStream = Readable.from(
    response.body as unknown as AsyncIterable<Uint8Array>,
  )
  const targetDir = join(process.cwd(), template)
  const extractedTarStream = tar.extract({
    strip: 1,
    C: targetDir,
  })
  if (existsSync(targetDir)) {
    spinner.fail(`Target directory ${targetDir} already exists.`)
    process.exit(1)
  }
  mkdirSync(targetDir, { recursive: true })
  nodeStream
    .pipe(extractedTarStream)
    .once('error', (err) => {
      spinner.fail(`Failed to extract template ${template} with ${err}`)
      process.exit(1)
    })
    .once('close', () => {
      spinner.succeed(`Template ${template} created on ${targetDir}.`)
    })
}
