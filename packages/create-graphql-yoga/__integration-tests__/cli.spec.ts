import { Request, Response, fetch } from '@whatwg-node/fetch'
import { createGraphQLYoga } from '../src/index.js'
import { createReadStream, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { rimrafSync } from 'rimraf'

describe('create-graphql-yoga', () => {
  const testProjectName = 'test-project'
  const testProjectDir = join(process.cwd(), testProjectName)
  afterEach(() => {
    rimrafSync(testProjectDir)
  })
  it('creates a new project with node-ts example by default', async () => {
    await createGraphQLYoga({
      argv: ['node', 'create-graphql-yoga'],
      input: Readable.from('test-project\n'),
      output: process.stdout,
      fetchFn: fetch,
    })
    const packageJsonPath = join(process.cwd(), 'test-project', 'package.json')
    const packageJsonContent = readFileSync(packageJsonPath, 'utf-8')
    const packageJson = JSON.parse(packageJsonContent)
    expect(packageJson.name).toEqual('test-project')
  })
})
