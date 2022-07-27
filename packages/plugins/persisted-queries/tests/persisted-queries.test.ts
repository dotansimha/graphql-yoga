import { createYoga, YogaServerInstance } from 'graphql-yoga'
import request from 'supertest'
import {
  createInMemoryPersistedQueriesStore,
  PersistedQueriesMode,
  PersistedQueriesStore,
  usePersistedQueries,
} from '../src'

describe('Persisted Queries', () => {
  let yoga: YogaServerInstance<any, any, any>
  let store: ReturnType<typeof createInMemoryPersistedQueriesStore>
  beforeAll(async () => {
    store = createInMemoryPersistedQueriesStore()
    yoga = createYoga({
      plugins: [
        usePersistedQueries({
          store,
        }),
      ],
    })
  })
  afterAll(() => {
    store.clear()
  })
  it('should return not found error if persisted query is missing', async () => {
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
  describe('Automatic', () => {
    beforeAll(async () => {
      store = createInMemoryPersistedQueriesStore()
      yoga = createYoga({
        plugins: [
          usePersistedQueries({
            store,
            mode: PersistedQueriesMode.AUTOMATIC,
          }),
        ],
      })
    })
    it('should save the persisted query', async () => {
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
  })
  describe('Persisted Only', () => {
    beforeAll(async () => {
      store = createInMemoryPersistedQueriesStore()
      yoga = createYoga({
        plugins: [
          usePersistedQueries({
            store,
            mode: PersistedQueriesMode.PERSISTED_ONLY,
          }),
        ],
      })
    })
    it('should not allow regular queries', async () => {
      const query = `{__typename}`
      const response = await request(yoga).post('/graphql').send({
        query,
      })

      const body = JSON.parse(response.text)
      expect(body.errors).toBeDefined()
      expect(body.errors[0].message).toBe('PersistedQueryOnly')
    })
    it('should not save the persisted query', async () => {
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
      expect(entry).toBeFalsy()

      const body = JSON.parse(response.text)
      expect(body.errors).toBeUndefined()
      expect(body.data.__typename).toBe('Query')
    })
  })
  describe('Manual', () => {
    beforeAll(async () => {
      store = createInMemoryPersistedQueriesStore()
      yoga = createYoga({
        plugins: [
          usePersistedQueries({
            store,
            mode: PersistedQueriesMode.MANUAL,
          }),
        ],
      })
    })
    it('should allow regular queries', async () => {
      const query = `{__typename}`
      const response = await request(yoga).post('/graphql').send({
        query,
      })

      const body = JSON.parse(response.text)
      expect(body.errors).toBeUndefined()
      expect(body.data.__typename).toBe('Query')
    })
    it('should not save the persisted query', async () => {
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
      expect(entry).toBeFalsy()

      const body = JSON.parse(response.text)
      expect(body.errors).toBeUndefined()
      expect(body.data.__typename).toBe('Query')
    })
  })
})
