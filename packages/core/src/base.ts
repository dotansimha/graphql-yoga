import { handleRequest } from '@graphql-yoga/handler'
import type { GraphQLSchema } from 'graphql'
import {
  Plugin,
  GetEnvelopedFn,
  envelop,
  useMaskedErrors,
  enableIf,
} from '@envelop/core'
import { useDisableIntrospection } from '@envelop/disable-introspection'

/**
 * Configuration options for the server
 */
export type GraphQLServerOptions = {
  schema: GraphQLSchema
  /**
   * GraphQL endpoint
   * Default: /graphql
   */
  endpoint?: string
  /**
   * Port to run server
   */
  port?: number
  /**
   * Envelop Plugins
   * @see https://envelop.dev/plugins
   */
  plugins?: Array<Plugin>
}

/**
 * Base class that can be extended to create a GraphQL server with any HTTP server framework.
 */
export abstract class BaseGraphQLServer {
  /**
   * Request handler for helix
   */
  protected handleRequest = handleRequest
  /**
   * Port for server
   */
  protected port: number
  /**
   * GraphQL Endpoint
   */
  protected endpoint: string
  protected schema: GraphQLSchema
  /**
   * Instance of envelop
   */
  protected envelop: GetEnvelopedFn<any>
  /**
   * Detect server environment
   */
  protected isProd = process.env.NODE_ENV === 'production'

  constructor(options: GraphQLServerOptions) {
    this.port = options.port || parseInt(process.env.PORT || '4000')
    this.endpoint = options.endpoint || '/graphql'
    this.schema = options.schema
    this.envelop = envelop({
      plugins: [
        enableIf(this.isProd, useDisableIntrospection()),
        enableIf(this.isProd, useMaskedErrors()),
        ...(options.plugins || []),
      ],
    })
  }

  /**
   * Start the server
   */
  abstract start(): void

  /**
   * Stop the server
   */
  abstract stop(): void
}
