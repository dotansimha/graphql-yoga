import { createYoga, YogaServerInstance } from 'graphql-yoga'
import request from 'supertest'
import {
  createInMemoryAutomaticPersistedQueriesStore,
  useAutomaticPersistedQueries,
} from '../src'

describe('Automatic Persisted Queries', () => {
  it('should return not found error if persisted query is missing', async () => {
    const store = createInMemoryAutomaticPersistedQueriesStore()
    const yoga = createYoga({
      plugins: [
        useAutomaticPersistedQueries({
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
    const store = createInMemoryAutomaticPersistedQueriesStore()
    const yoga = createYoga({
      plugins: [
        useAutomaticPersistedQueries({
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
  it('should save the persisted query', async () => {
    const store = createInMemoryAutomaticPersistedQueriesStore()
    const yoga = createYoga({
      plugins: [
        useAutomaticPersistedQueries({
          store,
        }),
      ],
    })

    const persistedQueryEntry = {
      version: 1,
      sha256Hash:
        'ecf4edb46db40b5132295c0291d62fb65d6759a9eedfa4d5d612dd5ec54a6b38',
    }
    const query = `{__typename}`
    const response = await request(yoga)
      .post('/graphql')
      .send({
        query,
        extensions: {
          persistedQuery: persistedQueryEntry,
        },
      })

    const entry = store.get(persistedQueryEntry.sha256Hash)
    expect(entry).toBe(query)

    const body = JSON.parse(response.text)
    expect(body.errors).toBeUndefined()
    expect(body.data.__typename).toBe('Query')
  })
  it('raises an error when the hash does not match the operation', async () => {
    const store = createInMemoryAutomaticPersistedQueriesStore()
    const yoga = createYoga({
      plugins: [
        useAutomaticPersistedQueries({
          store,
        }),
      ],
    })
    const query = `{__typename}`
    const response = await request(yoga)
      .post('/graphql')
      .send({
        query,
        extensions: {
          persistedQuery: {
            version: 1,
            sha256Hash: 'leoeoel',
          },
        },
      })
    expect(response.status).toEqual(200)
    expect(JSON.parse(response.text)).toEqual({
      data: null,
      errors: [{ message: 'PersistedQueryMismatch' }],
    })
  })
})
