import { BaseNodeGraphQLServerOptions } from '@graphql-yoga/core'
import type { FastifyCorsOptions } from 'fastify-cors'
import { IncomingHttpHeaders } from 'http'
import { OutgoingHttpHeaders } from 'http2'

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
  query: string
  /** Variables for GraphQL Operation */
  variables?: Record<string, any>
  /** Name for GraphQL Operation */
  operationName?: string
  /** Set any headers for the GraphQL request */
  headers?: IncomingHttpHeaders | OutgoingHttpHeaders
}
