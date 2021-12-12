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
import { makeExecutableSchema } from '@graphql-tools/schema'
import { IResolvers, TypeSource } from '@graphql-tools/utils'

/**
 * Configuration options for the server
 */
export type BaseGraphQLServerOptions<TContext = any> = {
  /**
   * Envelop Plugins
   * @see https://envelop.dev/plugins
   */
  plugins?: Array<Plugin>
  /**
   * Detect server environment
   * Default: `false`
   */
  isDev?: boolean
  /**
   * Context
   */
  context?: (req: Request) => Promise<TContext> | Promise<TContext>
} & (
  | {
      schema: GraphQLSchema
    }
  | {
      typeDefs: TypeSource
      resolvers?: IResolvers<any, TContext>
    }
)

/**
 * Base class that can be extended to create a GraphQL server with any HTTP server framework.
 */
export abstract class BaseGraphQLServer {
  /**
   * Request handler for helix
   */
  protected handleRequest = handleRequest
  protected schema: GraphQLSchema
  /**
   * Instance of envelop
   */
  protected envelop: GetEnvelopedFn<any>
  protected isDev: boolean
  protected logger: Logger

  constructor(options: BaseGraphQLServerOptions) {
    this.schema =
      'schema' in options
        ? options.schema
        : makeExecutableSchema({
            typeDefs: options.typeDefs,
            resolvers: options.resolvers,
          })

    this.logger = dummyLogger
    this.isDev = options.isDev ?? false

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
          this.isDev,
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
        enableIf(!this.isDev, useDisableIntrospection()),
        // Mask errors in production
        enableIf(!this.isDev, useMaskedErrors()),
        ...(options.context != null
          ? [
              useExtendContext(
                typeof options.context === 'function'
                  ? options.context
                  : () => options.context,
              ),
            ]
          : []),
        ...(options.plugins || []),
      ],
    })
  }
}

/**
 * Configuration options for the server
 */
export type BaseNodeGraphQLServerOptions = {
  /**
   * GraphQL endpoint
   * Default: `/graphql`
   */
  endpoint?: string
  /**
   * Port to run server
   */
  port?: number
} & BaseGraphQLServerOptions

/**
 * Base class that can be extended to use any Node.js HTTP server framework.
 */
export abstract class BaseNodeGraphQLServer extends BaseGraphQLServer {
  /**
   * Port for server
   */
  protected port: number
  /**
   * GraphQL Endpoint
   */
  protected endpoint: string

  constructor(options: BaseNodeGraphQLServerOptions) {
    super(options)
    this.port = options.port || parseInt(process.env.PORT || '4000')
    this.endpoint = options.endpoint || '/graphql'
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
