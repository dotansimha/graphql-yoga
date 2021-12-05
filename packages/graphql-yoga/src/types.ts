import type { BaseNodeGraphQLServerOptions } from '@graphql-yoga/core'
import type { FastifyCorsOptions } from 'fastify-cors'
import type { DocumentNode } from 'graphql'
import type { IncomingHttpHeaders } from 'http'
import type { OutgoingHttpHeaders } from 'http2'

/**
 * Configuration options for the server
 */
export type GraphQLServerOptions = BaseNodeGraphQLServerOptions & {
  cors?: FastifyCorsOptions
  uploads?: boolean
  /**
   * Enable pino logging
   * @default true
   */
  enableLogging?: boolean
}

export type GraphQLServerInject = {
  /** GraphQL Operation to execute */
  operation: string | DocumentNode
  /** Variables for GraphQL Operation */
  variables?: Record<string, any>
  /** Name for GraphQL Operation */
  operationName?: string
  /** Set any headers for the GraphQL request */
  headers?: IncomingHttpHeaders | OutgoingHttpHeaders
}
