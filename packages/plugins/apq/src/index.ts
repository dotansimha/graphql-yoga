import { Plugin, PromiseOrValue } from 'graphql-yoga'
import { GraphQLError } from 'graphql'
import lru from 'tiny-lru'
import { crypto, TextEncoder } from '@whatwg-node/fetch'

const textEncoder = new TextEncoder()
export async function hashSHA256(str: string) {
  const utf8 = textEncoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', utf8)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray
    .map((bytes) => bytes.toString(16).padStart(2, '0'))
    .join('')
  return hashHex
}

export interface APQStoreOptions {
  max?: number
  ttl?: number
}

export function createInMemoryAPQStore(
  options: APQStoreOptions = {},
): APQStore {
  return lru<string>(options.max ?? 1000, options.ttl ?? 36000)
}

export interface APQOptions {
  store?: APQStore
  hash?: (str: string) => PromiseOrValue<string>
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

export function useAPQ<TPluginContext>(
  options: APQOptions = {},
): Plugin<TPluginContext> {
  const { store = createInMemoryAPQStore(), hash = hashSHA256 } = options

  return {
    async onParams({ params, setParams }) {
      const persistedQueryData = decodeAPQExtension(
        params.extensions?.persistedQuery,
      )

      if (persistedQueryData === null) {
        return
      }

      if (params.query == null) {
        const persistedQuery = await store.get(persistedQueryData.sha256Hash)
        if (persistedQuery == null) {
          throw new GraphQLError('PersistedQueryNotFound')
        }
        setParams({
          ...params,
          query: persistedQuery,
        })
      } else {
        const expectedHash = await hash(params.query)
        if (persistedQueryData.sha256Hash !== expectedHash) {
          throw new GraphQLError('PersistedQueryMismatch')
        }
        await store.set(persistedQueryData.sha256Hash, params.query)
      }
    },
  }
}
