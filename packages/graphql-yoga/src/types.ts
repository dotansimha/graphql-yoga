import type { BaseNodeGraphQLServerOptions } from '@graphql-yoga/core'
import type { DocumentNode } from 'graphql'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { IncomingHttpHeaders } from 'http'
import { OutgoingHttpHeaders } from 'http2'

/**
 * Configuration options for the server
 */
export type GraphQLServerOptions = BaseNodeGraphQLServerOptions & {
  /**
   * Enable pino logging
   * @default true
   */
  enableLogging?: boolean
}

export type GraphQLServerInject<
  TData = any,
  TVariables = Record<string, any>,
  > = {
    /** GraphQL Operation to execute */
    document: string | DocumentNode | TypedDocumentNode<TData, TVariables>
    /** Variables for GraphQL Operation */
    variables?: TVariables
    /** Name for GraphQL Operation */
    operationName?: string
    /** Set any headers for the GraphQL request */
    headers?: IncomingHttpHeaders | OutgoingHttpHeaders | undefined
  }
