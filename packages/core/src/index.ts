import { GraphiQLOptions, handleRequest } from '@graphql-yoga/handler'
import { GraphQLSchema } from 'graphql'
import {
  Plugin,
  GetEnvelopedFn,
  envelop,
  useMaskedErrors,
  UseMaskedErrorsOpts,
  useExtendContext,
  enableIf,
  useLogger,
  useSchema,
} from '@envelop/core'
import { useDisableIntrospection } from '@envelop/disable-introspection'
import { useValidationCache } from '@envelop/validation-cache'
import { useParserCache } from '@envelop/parser-cache'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { IResolvers, TypeSource } from '@graphql-tools/utils'

export type ServerCORSOptions = {
  origin: string[]
  methods?: string[]
  allowedHeaders?: string[]
  exposedHeaders?: string[]
  credentials?: boolean
  maxAge?: number
  optionsSuccessStatus?: number
}

const DEFAULT_CORS_OPTIONS: ServerCORSOptions = {
  origin: ['*'],
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  optionsSuccessStatus: 204,
}

/**
 * Configuration options for the server
 */
export type ServerOptions<TContext> = {
  /**
   * Envelop Plugins
   * @see https://envelop.dev/plugins
   */
  plugins?: Array<Plugin<TContext>>
  /**
   * Enable logger
   *
   * Default: `false`
   */
  logger?: boolean
  /**
   * Allow introspection query. This is useful for exploring the API with tools like GraphiQL.
   * If you are making a private GraphQL API,
   * it is suggested that you disable this in production so that
   * potential malicious API consumers do not see what all operations are possible.
   *
   * You can learn more about GraphQL introspection here:
   * @see https://graphql.org/learn/introspection/
   *
   * Default: `true`
   */
  introspection?: boolean
  /**
   * Prevent leaking unexpected errors to the client. We highly recommend enabling this in production.
   * If you throw `GraphQLServerError`/`EnvelopError` within your GraphQL resolvers then that error will be sent back to the client.
   *
   * You can lean more about this here:
   * @see https://www.envelop.dev/plugins/use-masked-errors
   *
   * Default: `false`
   */
  maskedErrors?: boolean | UseMaskedErrorsOpts
  /**
   * Context
   */
  context?: (req: Request) => Promise<TContext> | Promise<TContext>
  cors?: ((request: Request) => ServerCORSOptions) | ServerCORSOptions | boolean
  /**
   * GraphiQL options
   *
   * Default: `true`
   */
  graphiql?: GraphiQLOptions | boolean
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
 * @internal
 */
export class Server<TContext> {
  /**
   * Request handler for helix
   */
  public readonly handleRequest = handleRequest
  public readonly schema: GraphQLSchema
  /**
   * Instance of envelop
   */
  public readonly getEnveloped: GetEnvelopedFn<TContext>
  public logger: Pick<Console, 'log' | 'debug' | 'error' | 'warn' | 'info'>
  public readonly corsOptionsFactory?: (request: Request) => ServerCORSOptions
  public readonly graphiql: GraphiQLOptions | false

  constructor(options: ServerOptions<TContext>) {
    this.schema =
      'schema' in options
        ? options.schema
        : makeExecutableSchema({
            typeDefs: options.typeDefs,
            resolvers: options.resolvers,
          })

    this.logger = options.logger
      ? console
      : {
          log: () => {},
          debug: () => {},
          error: () => {},
          warn: () => {},
          info: () => {},
        }

    const maskedErrors = options.maskedErrors || false

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
          options.logger ?? false,
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
        enableIf(!(options.introspection ?? true), useDisableIntrospection()),
        enableIf(
          !!maskedErrors,
          useMaskedErrors(
            typeof maskedErrors === 'object' ? maskedErrors : undefined,
          ),
        ),
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
        const userProvidedCorsOptionsFactory = options.cors
        this.corsOptionsFactory = (...args) => {
          const corsOptions = userProvidedCorsOptionsFactory(...args)
          return {
            ...DEFAULT_CORS_OPTIONS,
            ...corsOptions,
          }
        }
      } else if (typeof options.cors === 'object') {
        const corsOptions = {
          ...DEFAULT_CORS_OPTIONS,
          ...options.cors,
        }
        this.corsOptionsFactory = () => corsOptions
      } else if (typeof options.cors === 'boolean') {
        this.corsOptionsFactory = () => DEFAULT_CORS_OPTIONS
      }
    }

    if (typeof options.graphiql === 'object' || options.graphiql === false) {
      this.graphiql = options.graphiql
    } else {
      this.graphiql = {}
    }
  }
}

export function createServer<TContext>(options: ServerOptions<TContext>) {
  return new Server<TContext>(options)
}
