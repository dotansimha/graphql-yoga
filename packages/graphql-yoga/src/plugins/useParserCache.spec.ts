import { buildSchema, DocumentNode, parse } from '@graphql-tools/graphql'
import {
  createEnvelopTestkit,
  assertSingleExecutionValue,
} from '../utils/envelop-testing.js'
import { useParserCache } from './useParserCache.js'
import { Plugin } from '@envelop/types'
import LRU from 'lru-cache'

describe('useParserCache', () => {
  const testSchema = buildSchema(/* GraphQL */ `
    type Query {
      foo: String
    }
  `)

  let testParser: jest.Mock<typeof parse>
  let useTestPlugin: Plugin

  beforeEach(() => {
    testParser = jest
      .fn()
      .mockImplementation((source, options) => parse(source, options))

    useTestPlugin = {
      onParse({ setParseFn }) {
        setParseFn(testParser as any as typeof parse)
      },
    }
  })

  afterEach(() => {
    testParser.mockReset()
  })

  it('Should call original parse when cache is empty', async () => {
    const testInstance = createEnvelopTestkit(
      [useTestPlugin, useParserCache()],
      testSchema,
    )
    await testInstance.execute(`query { foo }`)
    expect(testParser).toHaveBeenCalledTimes(1)
  })

  it('Should call parse once once when operation is cached', async () => {
    const testInstance = createEnvelopTestkit(
      [useTestPlugin, useParserCache()],
      testSchema,
    )
    await testInstance.execute(`query { foo }`)
    await testInstance.execute(`query { foo }`)
    await testInstance.execute(`query { foo }`)
    expect(testParser).toHaveBeenCalledTimes(1)
  })

  it('Should call parse once once when operation is cached and errored', async () => {
    const testInstance = createEnvelopTestkit(
      [useTestPlugin, useParserCache()],
      testSchema,
    )
    const r1 = await testInstance.execute(`FAILED\ { foo }`)
    assertSingleExecutionValue(r1)
    const r2 = await testInstance.execute(`FAILED\ { foo }`)
    assertSingleExecutionValue(r2)
    expect(testParser).toHaveBeenCalledTimes(1)
    expect(r1.errors![0].message).toBe(
      `Syntax Error: Unexpected Name "FAILED".`,
    )
    expect(r2.errors![0].message).toBe(
      `Syntax Error: Unexpected Name "FAILED".`,
    )
    expect(r1).toEqual(r2)
  })

  it('Should call parse multiple times on different operations', async () => {
    const testInstance = createEnvelopTestkit(
      [useTestPlugin, useParserCache()],
      testSchema,
    )
    await testInstance.execute(`query t { foo }`)
    await testInstance.execute(`query t2 { foo }`)
    expect(testParser).toHaveBeenCalledTimes(2)
  })

  it('should call parse multiple times when operation is invalidated', async () => {
    const cache = new LRU<string, DocumentNode>({
      max: 100,
      maxAge: 1,
    })
    const testInstance = createEnvelopTestkit(
      [
        useTestPlugin,
        useParserCache({
          documentCache: cache,
        }),
      ],
      testSchema,
    )
    await testInstance.execute(`query t { foo }`)
    await testInstance.wait(10)
    await testInstance.execute(`query t { foo }`)
    expect(testParser).toHaveBeenCalledTimes(2)
  })

  it('should use provided documentCache instance', async () => {
    const documentCache = new LRU<string, DocumentNode>()
    jest.spyOn(documentCache, 'set')
    jest.spyOn(documentCache, 'get')
    const testInstance = createEnvelopTestkit(
      [
        useTestPlugin,
        useParserCache({
          documentCache,
        }),
      ],
      testSchema,
    )

    await testInstance.execute(`query t { foo }`)
    expect(documentCache.get).toHaveBeenCalled()
    expect(documentCache.set).toHaveBeenCalled()
  })

  it('should use provided documentCache instance', async () => {
    const errorCache = new LRU<string, Error>()
    jest.spyOn(errorCache, 'set')
    jest.spyOn(errorCache, 'get')
    const testInstance = createEnvelopTestkit(
      [
        useTestPlugin,
        useParserCache({
          errorCache,
        }),
      ],
      testSchema,
    )

    await testInstance.execute(`FAILED\ { foo }`)
    expect(errorCache.get).toHaveBeenCalled()
    expect(errorCache.set).toHaveBeenCalled()
  })
})
