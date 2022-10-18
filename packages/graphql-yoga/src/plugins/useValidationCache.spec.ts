import { buildSchema, GraphQLError, validate } from '@graphql-tools/graphql'
import { Plugin } from '@envelop/types'
import LRU from 'lru-cache'
import { createEnvelopTestkit } from '../utils/envelop-testing.js'
import { useValidationCache } from './useValidationCache.js'

describe('useValidationCache', () => {
  const testSchema = buildSchema(/* GraphQL */ `
    type Query {
      foo: String
    }
  `)

  let testValidator: jest.Mock<typeof validate>
  let useTestPlugin: Plugin<any>

  beforeEach(() => {
    testValidator = jest
      .fn()
      .mockImplementation((source, options) => validate(source, options))

    useTestPlugin = {
      onValidate({ setValidationFn }) {
        setValidationFn(testValidator as any as typeof validate)
      },
    }
  })

  afterEach(() => {
    testValidator.mockReset()
  })

  it('Should call original validate when cache is empty', async () => {
    const testInstance = createEnvelopTestkit(
      [useTestPlugin, useValidationCache()],
      testSchema,
    )
    await testInstance.execute(`query { foo }`)
    expect(testValidator).toHaveBeenCalledTimes(1)
  })

  it('Should call validate once once when operation is cached', async () => {
    const testInstance = createEnvelopTestkit(
      [useTestPlugin, useValidationCache()],
      testSchema,
    )
    await testInstance.execute(`query { foo }`)
    await testInstance.execute(`query { foo }`)
    await testInstance.execute(`query { foo }`)
    expect(testValidator).toHaveBeenCalledTimes(1)
  })

  it('Should call validate once once when operation is cached and errored', async () => {
    const testInstance = createEnvelopTestkit(
      [useTestPlugin, useValidationCache()],
      testSchema,
    )
    const r1 = await testInstance.execute(`query { foo2 }`)
    const r2 = await testInstance.execute(`query { foo2 }`)
    expect(testValidator).toHaveBeenCalledTimes(1)
    expect(r1).toEqual(r2)
  })

  it('Should call validate multiple times on different operations', async () => {
    const testInstance = createEnvelopTestkit(
      [useTestPlugin, useValidationCache()],
      testSchema,
    )
    await testInstance.execute(`query t { foo }`)
    await testInstance.execute(`query t2 { foo }`)
    expect(testValidator).toHaveBeenCalledTimes(2)
  })

  it('should call validate multiple times when operation is invalidated', async () => {
    const cache = new LRU<string, readonly GraphQLError[]>({
      max: 100,
      maxAge: 1,
    })
    const testInstance = createEnvelopTestkit(
      [
        useTestPlugin,
        useValidationCache({
          cache,
        }),
      ],
      testSchema,
    )
    await testInstance.execute(`query t { foo }`)
    await testInstance.wait(10)
    await testInstance.execute(`query t { foo }`)
    expect(testValidator).toHaveBeenCalledTimes(2)
  })

  it('should use provided cache instance', async () => {
    const cache = new LRU<string, readonly GraphQLError[]>()
    jest.spyOn(cache, 'set')
    jest.spyOn(cache, 'get')
    const testInstance = createEnvelopTestkit(
      [
        useTestPlugin,
        useValidationCache({
          cache,
        }),
      ],
      testSchema,
    )
    await testInstance.execute(`query { foo2 }`)
    await testInstance.execute(`query { foo2 }`)
    expect(cache.get).toHaveBeenCalled()
    expect(cache.set).toHaveBeenCalled()
  })
})
