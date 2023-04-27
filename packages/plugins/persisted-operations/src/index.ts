import { DocumentNode } from 'graphql'
import {
  createGraphQLError,
  GraphQLParams,
  Plugin,
  PromiseOrValue,
} from 'graphql-yoga'

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

export type UsePersistedOperationsOptions = {
  /**
   * A function that fetches the persisted operation
   */
  getPersistedOperation(
    key: string,
  ): PromiseOrValue<DocumentNode | string | null>
  /**
   * Whether to allow execution of arbitrary GraphQL operations aside from persisted operations.
   */
  allowArbitraryOperations?: boolean | AllowArbitraryOperationsHandler
  /**
   * The path to the persisted operation id
   */
  extractPersistedOperationId?: ExtractPersistedOperationId

  /**
   * Whether to skip validation of the persisted operation
   */
  skipDocumentValidation?: boolean

  /**
   * Custom errors to be thrown
   */
  customErrors?: CustomPersistedQueryErrors
}

export type CustomErrorFactory = string

export type CustomPersistedQueryErrors = {
  /**
   * Error to be thrown when the persisted operation is not found
   */
  notFound?: CustomErrorFactory
}

export function usePersistedOperations<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TPluginContext extends Record<string, any>,
>({
  allowArbitraryOperations = false,
  extractPersistedOperationId = defaultExtractPersistedOperationId,
  getPersistedOperation,
  skipDocumentValidation = false,
  customErrors,
}: UsePersistedOperationsOptions): Plugin<TPluginContext> {
  const operationASTByRequest = new WeakMap<Request, DocumentNode>()
  const persistedOperationRequest = new WeakSet<Request>()
  return {
    async onParams({ request, params, setParams }) {
      if (params.query) {
        if (
          (typeof allowArbitraryOperations === 'boolean'
            ? allowArbitraryOperations
            : await allowArbitraryOperations(request)) === false
        ) {
          throw createGraphQLError('PersistedQueryOnly')
        }
        return
      }

      const persistedOperationKey = extractPersistedOperationId(params)

      if (persistedOperationKey == null) {
        throw createGraphQLError('PersistedQueryNotFound')
      }

      const persistedQuery = await getPersistedOperation(persistedOperationKey)
      if (persistedQuery == null) {
        throw createGraphQLError(
          customErrors?.notFound ?? 'PersistedQueryNotFound',
        )
      }

      if (typeof persistedQuery === 'object') {
        setParams({
          query: `__PERSISTED_OPERATION_${persistedOperationKey}__`,
          variables: params.variables,
          extensions: params.extensions,
        })
        operationASTByRequest.set(request, persistedQuery)
      } else {
        setParams({
          query: persistedQuery,
          variables: params.variables,
          extensions: params.extensions,
        })
      }
      persistedOperationRequest.add(request)
    },
    onValidate({ setResult, context: { request } }) {
      if (skipDocumentValidation && persistedOperationRequest.has(request)) {
        setResult([]) // skip validation
      }
    },
    onParse({ setParsedDocument, context: { request } }) {
      const ast = operationASTByRequest.get(request)
      if (ast) {
        setParsedDocument(ast)
      }
    },
  }
}
