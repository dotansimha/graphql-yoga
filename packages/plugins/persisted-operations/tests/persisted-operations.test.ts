import { createYoga } from 'graphql-yoga'
import request from 'supertest'
import { usePersistedOperations } from '../src'

describe('Automatic Persisted Queries', () => {
  it('should return not found error if persisted query is missing', async () => {
    const store = new Map<string, string>()
    const yoga = createYoga({
      plugins: [
        usePersistedOperations({
          store,
        }),
      ],
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
          store,
        }),
      ],
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
          store,
        }),
      ],
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
    expect(body.errors[0].message).toBe('PersistedQueryNotFound')
  })
  it('should allow non-persisted operations via allowArbitraryOperations flag', async () => {
    const store = new Map<string, string>()

    const yoga = createYoga({
      plugins: [
        usePersistedOperations({
          store,
          allowArbitraryOperations: true,
        }),
      ],
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
          store,
          allowArbitraryOperations: (request) =>
            request.headers.get('foo') === 'bar',
        }),
      ],
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
})
