import { GraphQLParams, Plugin, PromiseOrValue } from 'graphql-yoga'
import { GraphQLError } from 'graphql'

export type ExtractPersistedOperationId = (
  params: GraphQLParams,
) => null | string

export const defaultExtractPersistedOperationId: ExtractPersistedOperationId = (
  params: GraphQLParams,
): null | string => {
  if (
    params.extensions != null &&
    typeof params.extensions === 'object' &&
    params.extensions?.persistedQuery != null &&
    typeof params.extensions?.persistedQuery === 'object' &&
    params.extensions?.persistedQuery.version === 1 &&
    typeof params.extensions?.persistedQuery.sha256Hash === 'string'
  ) {
    return params.extensions?.persistedQuery.sha256Hash
  }
  return null
}

type AllowArbitraryOperationsHandler = (
  request: Request,
) => PromiseOrValue<boolean>

export interface UsePersistedOperationsOptions {
  /**
   * A function that fetches the persisted operation
   */
  getPersistedOperation(key: string): PromiseOrValue<string | null>
  /**
   * Whether to allow execution of arbitrary GraphQL operations aside from persisted operations.
   */
  allowArbitraryOperations?: boolean | AllowArbitraryOperationsHandler
  /**
   * The path to the persisted operation id
   */
  extractPersistedOperationId?: ExtractPersistedOperationId
}

export function usePersistedOperations<TPluginContext>({
  getPersistedOperation,
  allowArbitraryOperations = false,
  extractPersistedOperationId = defaultExtractPersistedOperationId,
}: UsePersistedOperationsOptions): Plugin<TPluginContext> {
  return {
    async onParams({ request, params, setParams }) {
      if (params.query) {
        if (
          (typeof allowArbitraryOperations === 'boolean'
            ? allowArbitraryOperations
            : await allowArbitraryOperations(request)) === false
        ) {
          throw new GraphQLError('PersistedQueryOnly')
        }
        return
      }

      const persistedOperationKey = extractPersistedOperationId(params)

      if (persistedOperationKey == null) {
        throw new GraphQLError('PersistedQueryNotFound')
      }

      const persistedQuery = await getPersistedOperation(persistedOperationKey)
      if (persistedQuery == null) {
        throw new GraphQLError('PersistedQueryNotFound')
      }
      setParams({
        query: persistedQuery,
        variables: params.variables,
        extensions: params.extensions,
      })
    },
  }
}
