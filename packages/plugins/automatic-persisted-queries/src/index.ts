import { Plugin, PromiseOrValue } from 'graphql-yoga'
import { GraphQLError } from 'graphql'
import lru from 'tiny-lru'
import { hashSHA256 } from './hash-sha256.js'

export interface AutomaticPersistedQueriesStoreOptions {
  max?: number
  ttl?: number
}

export function createInMemoryAutomaticPersistedQueriesStore(
  options: AutomaticPersistedQueriesStoreOptions = {},
): AutomaticPersistedQueriesStore {
  return lru<string>(options.max ?? 1000, options.ttl ?? 36000)
}

export interface AutomaticPersistedQueriesOptions {
  store?: AutomaticPersistedQueriesStore
  hash?: (str: string) => PromiseOrValue<string>
}

export interface AutomaticPersistedQueriesStore {
  get(key: string): PromiseOrValue<string | null | undefined>
  set(key: string, query: string): PromiseOrValue<any>
}

export interface AutomaticPersistedQueryExtension {
  version: 1
  sha256Hash: string
}

function decodeAutomaticPersistedQueryExtension(
  input: Record<string, any> | null | undefined,
): null | AutomaticPersistedQueryExtension {
  if (
    input != null &&
    typeof input === 'object' &&
    input?.version === 1 &&
    typeof input?.sha256Hash === 'string'
  ) {
    return input as AutomaticPersistedQueryExtension
  }
  return null
}

export function useAutomaticPersistedQueries<TPluginContext>(
  options: AutomaticPersistedQueriesOptions = {},
): Plugin<TPluginContext> {
  const {
    store = createInMemoryAutomaticPersistedQueriesStore(),
    hash = hashSHA256,
  } = options

  return {
    onRequestParse() {
      return {
        onRequestParseDone: async function persistedQueriesOnRequestParseDone({
          params,
          setParams,
        }) {
          const persistedQueryData = decodeAutomaticPersistedQueryExtension(
            params.extensions?.persistedQuery,
          )

          if (persistedQueryData === null) {
            return
          }

          if (params.query == null) {
            const persistedQuery = await store.get(
              persistedQueryData.sha256Hash,
            )
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
    },
  }
}
