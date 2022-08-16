import { createYoga, createSchema, GraphQLParams } from 'graphql-yoga'
import request from 'supertest'
import { usePersistedOperations } from '@graphql-yoga/plugin-persisted-operations'

const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type Query {
      _: String
    }
  `,
})

describe('Persisted Operations', () => {
  it('should return not found error if persisted query is missing', async () => {
    const yoga = createYoga({
      plugins: [
        usePersistedOperations({
          getPersistedOperation() {
            return null
          },
        }),
      ],
      schema,
    })
    const response = await request(yoga)
      .post('/graphql')
      .send({
        extensions: {
          persistedQuery: {
            version: 1,
            sha256Hash:
              'ecf4edb46db40b5132295c0291d62fb65d6759a9eedfa4d5d612dd5ec54a6b38',
          },
        },
      })

    const body = JSON.parse(response.text)
    expect(body.errors).toBeDefined()
    expect(body.errors[0].message).toBe('PersistedQueryNotFound')
  })
  it('should load the persisted query when stored', async () => {
    const store = new Map<string, string>()
    const yoga = createYoga({
      plugins: [
        usePersistedOperations({
          getPersistedOperation(key: string) {
            return store.get(key) || null
          },
        }),
      ],
      schema,
    })
    const persistedQueryEntry = {
      version: 1,
      sha256Hash:
        'ecf4edb46db40b5132295c0291d62fb65d6759a9eedfa4d5d612dd5ec54a6b38',
    }
    store.set(persistedQueryEntry.sha256Hash, '{__typename}')
    const response = await request(yoga)
      .post('/graphql')
      .send({
        extensions: {
          persistedQuery: persistedQueryEntry,
        },
      })

    const body = JSON.parse(response.text)
    expect(body.errors).toBeUndefined()
    expect(body.data.__typename).toBe('Query')
  })
  it('should reject non-persisted operations', async () => {
    const store = new Map<string, string>()

    const yoga = createYoga({
      plugins: [
        usePersistedOperations({
          getPersistedOperation(key: string) {
            return store.get(key) || null
          },
        }),
      ],
      schema,
    })
    const persistedQueryEntry = {
      version: 1,
      sha256Hash:
        'ecf4edb46db40b5132295c0291d62fb65d6759a9eedfa4d5d612dd5ec54a6b38',
    }
    store.set(persistedQueryEntry.sha256Hash, '{__typename}')

    const response = await request(yoga).post('/graphql').send({
      query: '{__typename}',
    })

    const body = JSON.parse(response.text)
    expect(body.errors).toBeDefined()
    expect(body.errors[0].message).toBe('PersistedQueryOnly')
  })
  it('should allow non-persisted operations via allowArbitraryOperations flag', async () => {
    const store = new Map<string, string>()

    const yoga = createYoga({
      plugins: [
        usePersistedOperations({
          getPersistedOperation(key: string) {
            return store.get(key) || null
          },
          allowArbitraryOperations: true,
        }),
      ],
      schema,
    })
    const persistedQueryEntry = {
      version: 1,
      sha256Hash:
        'ecf4edb46db40b5132295c0291d62fb65d6759a9eedfa4d5d612dd5ec54a6b38',
    }
    store.set(persistedQueryEntry.sha256Hash, '{__typename}')

    const response = await request(yoga).post('/graphql').send({
      query: '{__typename}',
    })

    const body = JSON.parse(response.text)
    expect(body.errors).toBeUndefined()
    expect(body.data).toEqual({ __typename: 'Query' })
  })
  it('should allow non-persisted operations via allowArbitraryOperations based on a header', async () => {
    const store = new Map<string, string>()

    const yoga = createYoga({
      plugins: [
        usePersistedOperations({
          getPersistedOperation(key: string) {
            return store.get(key) || null
          },
          allowArbitraryOperations: (request) =>
            request.headers.get('foo') === 'bar',
        }),
      ],
      schema,
    })
    const persistedQueryEntry = {
      version: 1,
      sha256Hash:
        'ecf4edb46db40b5132295c0291d62fb65d6759a9eedfa4d5d612dd5ec54a6b38',
    }
    store.set(persistedQueryEntry.sha256Hash, '{__typename}')

    const response = await request(yoga)
      .post('/graphql')
      .set('foo', 'bar')
      .send({
        query: '{__typename}',
      })

    const body = JSON.parse(response.text)
    expect(body.errors).toBeUndefined()
    expect(body.data).toEqual({ __typename: 'Query' })
  })
  it('should respect the custom getPersistedQueryKey implementation (Relay)', async () => {
    const store = new Map<string, string>()
    const yoga = createYoga({
      plugins: [
        usePersistedOperations({
          getPersistedOperation(key: string) {
            return store.get(key) || null
          },
          getPersistedOperationKey(params: GraphQLParams & { doc_id: string }) {
            return params.doc_id ?? null
          },
        }),
      ],
      schema,
    })
    const persistedOperationKey = 'my-persisted-operation'
    store.set(persistedOperationKey, '{__typename}')
    const response = await request(yoga).post('/graphql').send({
      doc_id: persistedOperationKey,
    })

    const body = JSON.parse(response.text)
    expect(body.errors).toBeUndefined()
    expect(body.data.__typename).toBe('Query')
  })
})
