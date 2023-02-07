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

export enum PersistedOperationType {
  SDL = 'SDL',
  AST = 'AST',
}

export type UsePersistedOperationsOptions = {
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
  skipValidation?: boolean
} & (
  | {
      /**
       * A function that fetches the persisted operation as AST
       */
      getPersistedOperation(key: string): PromiseOrValue<DocumentNode | null>

      operationType: PersistedOperationType.AST
    }
  | {
      /**
       * A function that fetches the persisted operation as SDL
       */
      getPersistedOperation(key: string): PromiseOrValue<string | null>

      /**
       * The type of the persisted operation
       *
       * AST: The persisted operation is an AST
       * SDL: The persisted operation is an SDL
       *
       * @default PersistedOperationType.SDL
       */
      operationType?: PersistedOperationType.SDL
    }
)

export function usePersistedOperations<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TPluginContext extends Record<string, any>,
>({
  allowArbitraryOperations = false,
  extractPersistedOperationId = defaultExtractPersistedOperationId,
  getPersistedOperation,
  operationType,
  skipValidation = true,
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
        throw createGraphQLError('PersistedQueryNotFound')
      }

      let queryInParams: string
      if (operationType === PersistedOperationType.AST) {
        queryInParams = '{ __typename }'
        operationASTByRequest.set(request, persistedQuery as DocumentNode)
      } else {
        queryInParams = persistedQuery as string
      }
      persistedOperationRequest.add(request)
      setParams({
        query: queryInParams,
        variables: params.variables,
        extensions: params.extensions,
      })
    },
    onValidate({ setResult, context: { request } }) {
      if (skipValidation && persistedOperationRequest.has(request)) {
        setResult([]) // skip validation
      }
    },
    onParse({ setParsedDocument, context: { request } }) {
      if (operationType === PersistedOperationType.AST) {
        const ast = operationASTByRequest.get(request)
        setParsedDocument(ast)
      }
    },
  }
}
