import { GraphQLYogaError, Plugin, PromiseOrValue } from '@graphql-yoga/common'
import lru from 'tiny-lru'

export interface PersistedQueriesStoreOptions {
  max?: number
  ttl?: number
}

export function createInMemoryPersistedQueriesStore(
  options: PersistedQueriesStoreOptions = {},
) {
  return lru<string>(options.max ?? 1000, options.ttl ?? 36000)
}

export interface PersistedQueriesOptions {
  store?: PersistedQueriesStore
  mode?: PersistedQueriesMode
  hash?: (str: string) => PromiseOrValue<string>
}

export enum PersistedQueriesMode {
  AUTOMATIC = 'AUTOMATIC',
  MANUAL = 'MANUAL',
  PERSISTED_ONLY = 'PERSISTED_ONLY',
}

export interface PersistedQueriesStore {
  get(key: string): PromiseOrValue<string | null | undefined>
  set?(key: string, query: string): PromiseOrValue<any>
}

export interface PersistedQueryExtension {
  version: 1
  sha256Hash: string
}

export function usePersistedQueries<TPluginContext>(
  options: PersistedQueriesOptions = {},
): Plugin<TPluginContext> {
  const {
    mode = PersistedQueriesMode.AUTOMATIC,
    store = createInMemoryPersistedQueriesStore(),
    hash,
  } = options
  if (mode === PersistedQueriesMode.AUTOMATIC && store.set == null) {
    throw new Error(
      `Automatic Persisted Queries require "set" method to be implemented`,
    )
  }
  return {
    onRequestParse() {
      return {
        onRequestParseDone: async function persistedQueriesOnRequestParseDone({
          params,
          setParams,
        }) {
          const persistedQueryData: PersistedQueryExtension =
            params.extensions?.persistedQuery
          if (
            mode === PersistedQueriesMode.PERSISTED_ONLY &&
            persistedQueryData == null
          ) {
            throw new GraphQLYogaError('PersistedQueryOnly')
          }
          if (persistedQueryData?.version === 1) {
            if (params.query == null) {
              const persistedQuery = await store.get(
                persistedQueryData.sha256Hash,
              )
              if (persistedQuery == null) {
                throw new GraphQLYogaError('PersistedQueryNotFound')
              }
              setParams({
                ...params,
                query: persistedQuery,
              })
            } else {
              if (hash != null) {
                const expectedHash = await hash(params.query)
                if (persistedQueryData.sha256Hash !== expectedHash) {
                  throw new GraphQLYogaError('PersistedQueryMismatch')
                }
              }
              if (mode === PersistedQueriesMode.AUTOMATIC) {
                await store.set!(persistedQueryData.sha256Hash, params.query)
              }
            }
          }
        },
      }
    },
  }
}
