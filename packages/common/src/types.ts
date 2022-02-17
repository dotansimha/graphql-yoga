import type {
  DocumentNode,
  ExecutionResult,
  GraphQLError,
  GraphQLSchema,
  OperationDefinitionNode,
} from 'graphql'

export interface ExecutionPatchResult<
  TData = { [key: string]: any },
  TExtensions = { [key: string]: any },
> {
  errors?: ReadonlyArray<GraphQLError>
  data?: TData | null
  path?: ReadonlyArray<string | number>
  label?: string
  hasNext: boolean
  extensions?: TExtensions
}

export interface GraphQLParams<TVariables = Record<string, any>> {
  operationName?: string
  query?: string
  variables?: string | TVariables
}

export interface FormatPayloadParams<TContext, TRootValue> {
  payload: ExecutionResult | ExecutionPatchResult
  context?: TContext
  document?: DocumentNode
  operation?: OperationDefinitionNode
  rootValue?: TRootValue
}

export interface YogaInitialContext {
  /**
   * A Document containing GraphQL Operations and Fragments to execute.
   */
  query?: string | DocumentNode
  /**
   * An object describing the HTTP request.
   */
  request: Request
  /**
   * The name of the Operation in the Document to execute.
   */
  operationName?: string
  /**
   * Values for any Variables defined by the Operation.
   */
  variables?: string | { [name: string]: any }
}

export interface RequestProcessContext<TContext, TRootValue>
  extends YogaInitialContext {
  /**
   * The GraphQL schema used to process the request.
   */
  schema: GraphQLSchema
  /**
   * A function whose return value is passed in as the `context` to `execute`.
   */
  contextFactory: () => Promise<TContext> | TContext
  /**
   * A function which will be used to execute instead of default `execute` from `graphql-js`.
   */
  execute: (...args: any[]) => any
  /**
   * A function which will be used to create a document instead of the default `parse` from `graphql-js`.
   */
  parse: (...args: any[]) => any
  /**
   * A function which will be used to subscribe instead of default `subscribe` from `graphql-js`.
   */
  subscribe: (...args: any[]) => any
  /**
   * A function which will be used to validate instead of default `validate` from `graphql-js`.
   */
  validate: (...args: any[]) => any
}

export interface CORSOptions {
  origin?: string[]
  methods?: string[]
  allowedHeaders?: string[]
  exposedHeaders?: string[]
  credentials?: boolean
  maxAge?: number
}

export type YogaLogger = Pick<Console, 'debug' | 'error' | 'warn' | 'info'>
export { EnvelopError as GraphQLYogaError } from '@envelop/core'
