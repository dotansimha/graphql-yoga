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
  useSchema,
} from '@envelop/core'
import { useDisableIntrospection } from '@envelop/disable-introspection'
import { useValidationCache } from '@envelop/validation-cache'
import { useParserCache } from '@envelop/parser-cache'
import { Logger, dummyLogger } from 'ts-log'

/**
 * Configuration options for the server
 */
export type BaseGraphQLServerOptions = {
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
  /**
   * Detect server environment
   */
  isProd: boolean
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
  protected isProd: boolean
  protected logger: Logger

  constructor(options: BaseGraphQLServerOptions) {
    this.port = options.port || parseInt(process.env.PORT || '4000')
    this.endpoint = options.endpoint || '/graphql'
    this.schema = options.schema
    this.logger = dummyLogger
    this.isProd = options.isProd

    this.envelop = envelop({
      plugins: [
        // Use the schema provided by the user
        useSchema(this.schema),
        // Performance things
        useParserCache(),
        useValidationCache(),
        // Inject logger instance to context. Useful to use logger in resolvers.
        useExtendContext(() => ({ logger: this.logger })),
        // Log events - useful for debugging purposes
        enableIf(
          !this.isProd,
          useLogger({
            logFn: (eventName, events) => {
              const logger = this.logger
              if (eventName === 'execute-start') {
                const context = events.args.contextValue
                const query = context.request?.body?.query
                const variables = context.request?.body?.variables
                const headers = context.request?.headers
                logger.debug(eventName)
                logger.debug(query, 'query')
                // there can be no variables
                if (variables && Object.keys(variables).length > 0) {
                  logger.debug(variables, 'variables')
                }
                logger.debug(headers, 'headers')
              }
              if (eventName === 'execute-end') {
                logger.debug(eventName)
                logger.debug(events.result, 'response')
              }
            },
          }),
        ),
        // Disable introspection in production
        enableIf(this.isProd, useDisableIntrospection()),
        // Mask errors in production
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
