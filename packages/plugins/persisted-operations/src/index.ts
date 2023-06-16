import { ASTNode, DocumentNode, GraphQLErrorExtensions, Source } from 'graphql'
import {
  createGraphQLError,
  GraphQLParams,
  Plugin,
  PromiseOrValue,
  type OnParamsEventPayload,
  Maybe,
} from 'graphql-yoga'

// GraphQLErrorOptions interface does not exist in graphql-js v15
export interface GraphQLErrorOptions {
  nodes?: ReadonlyArray<ASTNode> | ASTNode | null | undefined
  source?: Maybe<Source>
  positions?: Maybe<ReadonlyArray<number>>
  path?: Maybe<ReadonlyArray<string | number>>
  originalError?: Maybe<Error & { readonly extensions?: unknown }>
  extensions?: Maybe<GraphQLErrorExtensions>
}

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
    request: Request,
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

export type CustomErrorFactory =
  | string
  | (GraphQLErrorOptions & { message: string })
  | ((payload: OnParamsEventPayload) => Error)

export type CustomPersistedQueryErrors = {
  /**
   * Error to be thrown when the persisted operation is not found
   */
  notFound?: CustomErrorFactory

  /**
   * Error to be thrown when rejecting non-persisted operations
   */
  persistedQueryOnly?: CustomErrorFactory

  /**
   * Error to be thrown when the extraction of the persisted operation id failed
   */
  keyNotFound?: CustomErrorFactory
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

  const notFoundErrorFactory = createErrorFactory(
    'PersistedQueryNotFound',
    customErrors?.notFound,
  )
  const keyNotFoundErrorFactory = createErrorFactory(
    'PersistedQueryKeyNotFound',
    customErrors?.keyNotFound,
  )
  const persistentQueryOnlyErrorFactory = createErrorFactory(
    'PersistedQueryOnly',
    customErrors?.persistedQueryOnly,
  )

  return {
    async onParams(payload) {
      const { request, params, setParams } = payload

      if (params.query) {
        if (
          (typeof allowArbitraryOperations === 'boolean'
            ? allowArbitraryOperations
            : await allowArbitraryOperations(request)) === false
        ) {
          throw persistentQueryOnlyErrorFactory(payload)
        }
        return
      }

      const persistedOperationKey = extractPersistedOperationId(params)

      if (persistedOperationKey == null) {
        throw keyNotFoundErrorFactory(payload)
      }

      const persistedQuery = await getPersistedOperation(
        persistedOperationKey,
        request,
      )
      if (persistedQuery == null) {
        throw notFoundErrorFactory(payload)
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

function createErrorFactory(
  defaultMessage: string,
  options?: CustomErrorFactory,
) {
  if (typeof options === 'string') {
    return () => createGraphQLError(options)
  }

  if (typeof options === 'function') {
    return options
  }

  return () => {
    return createGraphQLError(options?.message ?? defaultMessage, options)
  }
}
