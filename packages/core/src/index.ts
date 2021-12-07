import { handleRequest } from '@graphql-yoga/handler'
import { GraphQLScalarType, GraphQLSchema } from 'graphql'
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

export type GraphQLServerCORSOptions = {
  origin: string[]
  methods?: string[]
  allowedHeaders?: string[]
  exposedHeaders?: string[]
  credentials?: boolean
  maxAge?: number
  optionsSuccessStatus?: number
}

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
  cors?: ((request: Request) => GraphQLServerCORSOptions) | GraphQLServerCORSOptions | boolean
} & ({
  schema: GraphQLSchema
} | {
  typeDefs: TypeSource
  resolvers?: IResolvers<any, TContext>
})

/**
 * Base class that can be extended to create a GraphQL server with any HTTP server framework.
 */
export abstract class BaseGraphQLServer {
  /**
   * Request handler for helix
   */
  public readonly handleRequest = (req: Request) => handleRequest(req, this)
  public readonly schema: GraphQLSchema
  /**
   * Instance of envelop
   */
  public readonly getEnveloped: GetEnvelopedFn<any>
  protected isDev: boolean
  public logger: Logger
  public readonly corsOptionsFactory?: (request: Request) => GraphQLServerCORSOptions

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

    this.getEnveloped = envelop({
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
              if (eventName === 'execute-start') {
                const context = events.args.contextValue
                const query = context.request?.body?.query
                const variables = context.request?.body?.variables
                const headers = context.request?.headers
                this.logger.debug(eventName)
                this.logger.debug(query, 'query')
                // there can be no variables
                if (variables && Object.keys(variables).length > 0) {
                  this.logger.debug(variables, 'variables')
                }
                this.logger.debug(headers, 'headers')
              }
              if (eventName === 'execute-end') {
                this.logger.debug(eventName)
                this.logger.debug(events.result, 'response')
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

    if (options.cors != null) {
      if (typeof options.cors === 'function') {
        this.corsOptionsFactory = options.cors
      } else if (typeof options.cors === 'object') {
        this.corsOptionsFactory = () => options.cors as GraphQLServerCORSOptions
      } else if (typeof options.cors === 'boolean') {
        this.corsOptionsFactory = () => ({
          "origin": ["*"],
          "methods": ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
          "optionsSuccessStatus": 204
        })
      }
    }
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
  /**
   * Hostname
   * Default: `localhost`
   */
  hostname?: string
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
  /**
   * Hostname for server
   */
  protected hostname: string

  constructor(options: BaseNodeGraphQLServerOptions) {
    super(options)
    this.port = options.port || parseInt(process.env.PORT || '4000')
    this.endpoint = options.endpoint || '/graphql'
    this.hostname = options.hostname || 'localhost'
  }

  /**
   * Start the server
   */
  abstract start(): Promise<void> | void

  /**
   * Stop the server
   */
  abstract stop(): Promise<void> | void
}

export const GraphQLBlob = new GraphQLScalarType({
  name: 'Blob',
  serialize: (value) => value,
  parseValue: (value) => value,
})