import ora from 'ora'
import { parseArgs } from 'node:util'
import { fetch } from '@whatwg-node/fetch'
import tar from 'tar'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { existsSync, mkdirSync } from 'node:fs'

export const spinner = ora()

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
    throw new Error(`Package not found: ${packageName}`)
  }
  if (!response.ok) {
    throw new Error(
      `Failed to fetch package ${packageName} with ${
        response.status
      }: ${await response.text()}`,
    )
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
    throw new Error(`Template not found: ${template}`)
  }
  if (!response.ok) {
    throw new Error(
      `Failed to fetch template ${template} with ${
        response.status
      }: ${await response.text()}`,
    )
  }
  if (!response.body) {
    throw new Error(`Failed to fetch template ${template} with empty body`)
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
    throw new Error(`Target directory ${targetDir} already exists.`)
  }
  mkdirSync(targetDir, { recursive: true })
  await new Promise<void>((resolve, reject) => {
    nodeStream
      .pipe(extractedTarStream)
      .once('error', (err) => {
        reject(new Error(`Failed to extract template ${template} with ${err}`))
      })
      .once('close', () => {
        resolve()
      })
  })
  spinner.succeed(`Template ${template} created on ${targetDir}.`)
}
