import { handleRequest } from '@graphql-yoga/handler'
import type { GraphQLSchema } from 'graphql'
import {
  Plugin,
  GetEnvelopedFn,
  envelop,
  useMaskedErrors,
  useExtendContext,
  enableIf,
  useLogger,
} from '@envelop/core'
import { useDisableIntrospection } from '@envelop/disable-introspection'
import pino from 'pino'

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
  protected logger: pino.Logger

  constructor(options: GraphQLServerOptions) {
    this.port = options.port || parseInt(process.env.PORT || '4000')
    this.endpoint = options.endpoint || '/graphql'
    this.schema = options.schema
    this.logger = pino({
      prettyPrint: {
        colorize: true,
      },
      level: this.isProd ? 'info' : 'debug',
    })

    this.envelop = envelop({
      plugins: [
        useLogger({
          logFn: (eventName, events) => {
            const logger = this.logger
            if (eventName === 'execute-start') {
              const context = events.args.contextValue
              const query = context.request?.body?.query
              const variables = context.request?.body?.variables
              const headers = context.request?.headers
              logger.debug(eventName)
              logger.info(query, 'query')
              // there can be no variables
              if (variables && Object.keys(variables).length > 0) {
                logger.info(variables, 'variables')
              }
              logger.debug(headers, 'headers')
            }
            if (eventName === 'execute-end') {
              logger.debug(eventName)
              logger.debug(events.result, 'response')
            }
          },
        }),
        useExtendContext(() => ({ logger: this.logger })),
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
