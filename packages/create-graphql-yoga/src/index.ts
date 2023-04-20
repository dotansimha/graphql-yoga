import ora from 'ora'
import { parseArgs } from 'node:util'
import tar from 'tar'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import getNpmTarballUrl from 'get-npm-tarball-url'

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

async function getVersionByTag(
  packageName: string,
  tag: string,
  fetchFn: typeof fetch,
) {
  const url = getRegistryAPIUrl(packageName, tag)
  const response = await fetchFn(url)
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

function getPackageNameAndTagForTemplate(template: string) {
  const [suffix, tag] = template.split('@')
  return {
    packageName: `@graphql-yoga/template-${suffix}`,
    tag: tag ?? 'latest',
  }
}

export interface CreateGraphQLYogaOpts {
  argv: string[]
  input: Readable
  output: NodeJS.WritableStream
  fetchFn: typeof fetch
}

export async function createGraphQLYoga({
  argv,
  input,
  output,
  fetchFn,
}: CreateGraphQLYogaOpts) {
  const args = [...argv]
  while (args[0].startsWith('/') || args[0] === '--') {
    args.shift()
  }
  const rl = createInterface({
    input,
    output,
  })

  const projectName = await new Promise<string>((resolve) => {
    rl.question('What is the name of your project? ', (answer) => {
      resolve(answer)
    })
  })

  const {
    values: { template = 'node-ts' },
  } = parseArgs({ args, options, allowPositionals: true })
  spinner.start(`Fetching template ${template}...`)
  const { packageName, tag } = getPackageNameAndTagForTemplate(template)
  const version = await getVersionByTag(packageName, tag, fetchFn)
  const url = getNpmTarballUrl(packageName, version)
  const response = await fetchFn(url)
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
  const targetDir = join(process.cwd(), projectName)
  if (existsSync(targetDir)) {
    throw new Error(`Target directory ${targetDir} already exists.`)
  }
  mkdirSync(targetDir, { recursive: true })
  await new Promise<void>((resolve, reject) => {
    const extractedTarStream = tar.extract({
      strip: 1,
      cwd: targetDir,
    })
    nodeStream
      .pipe(extractedTarStream)
      .once('error', (err) => {
        reject(new Error(`Failed to extract template ${template} with ${err}`))
      })
      .once('close', () => {
        resolve()
      })
  })
  const packageJsonPath = join(targetDir, 'package.json')
  const packageJsonContent = readFileSync(packageJsonPath, 'utf-8')
  const packageJson = JSON.parse(packageJsonContent)
  packageJson.name = projectName
  delete packageJson.version
  packageJson.private = true
  const newPackageJsonContent = JSON.stringify(packageJson, null, 2)
  writeFileSync(packageJsonPath, newPackageJsonContent)

  spinner.succeed(`Project ${projectName} created on ${targetDir}.`)
}
