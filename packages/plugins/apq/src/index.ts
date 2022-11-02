import { Plugin, PromiseOrValue, createGraphQLError } from 'graphql-yoga'
import { lru } from 'tiny-lru'

export async function hashSHA256(
  str: string,
  api: {
    crypto: Crypto
    TextEncoder: typeof globalThis['TextEncoder']
  } = globalThis,
) {
  const { crypto, TextEncoder } = api
  const textEncoder = new TextEncoder()
  const utf8 = textEncoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', utf8)
  let hashHex = ''
  for (const bytes of new Uint8Array(hashBuffer)) {
    hashHex += bytes.toString(16).padStart(2, '0')
  }
  return hashHex
}

export interface APQStoreOptions {
  max?: number
  ttl?: number
}

export function createInMemoryAPQStore(
  options: APQStoreOptions = {},
): APQStore {
  return lru(options.max ?? 1000, options.ttl ?? 36000)
}

export interface APQOptions {
  store?: APQStore
  hash?: (
    str: string,
    api: { crypto: Crypto; TextEncoder: typeof TextEncoder },
  ) => PromiseOrValue<string>
}

export interface APQStore {
  get(key: string): PromiseOrValue<string | null | undefined>
  set(key: string, query: string): PromiseOrValue<any>
}

export interface APQExtension {
  version: 1
  sha256Hash: string
}

function decodeAPQExtension(
  input: Record<string, any> | null | undefined,
): null | APQExtension {
  if (
    input != null &&
    typeof input === 'object' &&
    input?.version === 1 &&
    typeof input?.sha256Hash === 'string'
  ) {
    return input as APQExtension
  }
  return null
}

export function useAPQ<TPluginContext extends Record<string, any>>(
  options: APQOptions = {},
): Plugin<TPluginContext> {
  const { store = createInMemoryAPQStore(), hash = hashSHA256 } = options

  return {
    async onParams({ params, setParams, fetchAPI }) {
      const persistedQueryData = decodeAPQExtension(
        params.extensions?.persistedQuery,
      )

      if (persistedQueryData === null) {
        return
      }

      if (params.query == null) {
        const persistedQuery = await store.get(persistedQueryData.sha256Hash)
        if (persistedQuery == null) {
          throw createGraphQLError('PersistedQueryNotFound', {
            extensions: {
              http: {
                status: 404,
              },
            },
          })
        }
        setParams({
          ...params,
          query: persistedQuery,
        })
      } else {
        const expectedHash = await hash(params.query, fetchAPI)
        if (persistedQueryData.sha256Hash !== expectedHash) {
          throw createGraphQLError('PersistedQueryMismatch', {
            extensions: {
              http: {
                status: 400,
              },
            },
          })
        }
        await store.set(persistedQueryData.sha256Hash, params.query)
      }
    },
  }
}
