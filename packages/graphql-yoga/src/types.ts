import type { BaseNodeGraphQLServerOptions } from '@graphql-yoga/core'
import type { FastifyCorsOptions } from 'fastify-cors'
import type { DocumentNode } from 'graphql'
import type { IncomingHttpHeaders } from 'http'
import type { OutgoingHttpHeaders } from 'http2'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'

/**
 * Configuration options for the server
 */
export type GraphQLServerOptions = BaseNodeGraphQLServerOptions & {
  cors?: FastifyCorsOptions
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
    document: string | TypedDocumentNode<TData, TVariables>
    /** Variables for GraphQL Operation */
    variables?: TVariables
    /** Name for GraphQL Operation */
    operationName?: string
    /** Set any headers for the GraphQL request */
    headers?: IncomingHttpHeaders | OutgoingHttpHeaders
  }

export type TypedResponse<TBody = any> = Omit<Response, 'json'> & {
  json: () => Promise<TBody>
}