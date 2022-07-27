import { Plugin, PromiseOrValue } from 'graphql-yoga'
import { GraphQLError } from 'graphql'

export interface PersistedOperationsStore {
  get(key: string): PromiseOrValue<string | null | undefined>
}

export interface AutomaticPersistedQueryExtension {
  version: 1
  sha256Hash: string
}

function decodePersistedOperationsExtension(
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

type AllowArbitraryOperationsHandler = (
  request: Request,
) => PromiseOrValue<boolean>

export interface UsePersistedOperationsOptions {
  /**
   * Store for reading persisted operations.
   */
  store: PersistedOperationsStore
  /**
   * Whether to allow execution of arbitrary GraphQL operations aside from persisted operations.
   */
  allowArbitraryOperations?: boolean | AllowArbitraryOperationsHandler
}

export function usePersistedOperations<TPluginContext>(
  args: UsePersistedOperationsOptions,
): Plugin<TPluginContext> {
  const allowArbitraryOperations = args.allowArbitraryOperations ?? false
  return {
    onRequestParse({ request }) {
      return {
        onRequestParseDone: async function persistedQueriesOnRequestParseDone({
          params,
          setParams,
        }) {
          if (params.query) {
            if (
              (typeof allowArbitraryOperations === 'boolean'
                ? allowArbitraryOperations
                : await allowArbitraryOperations(request)) === false
            ) {
              throw new GraphQLError('PersistedQueryNotFound')
            }
            return
          }

          const persistedQueryData = decodePersistedOperationsExtension(
            params.extensions?.persistedQuery,
          )

          if (persistedQueryData == null) {
            throw new GraphQLError('PersistedQueryNotFound')
          }

          const persistedQuery = await args.store.get(
            persistedQueryData.sha256Hash,
          )
          if (persistedQuery == null) {
            throw new GraphQLError('PersistedQueryNotFound')
          }
          setParams({
            ...params,
            query: persistedQuery,
          })
        },
      }
    },
  }
}
