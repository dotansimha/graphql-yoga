import { GraphiQLOptions, handleRequest } from '@graphql-yoga/handler'
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

const DEFAULT_CORS_OPTIONS: GraphQLServerCORSOptions = {
  origin: ['*'],
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  optionsSuccessStatus: 204,
}

/**
 * Configuration options for the server
 */
export type BaseGraphQLServerOptions<TContext> = {
  /**
   * Envelop Plugins
   * @see https://envelop.dev/plugins
   */
  plugins?: Array<Plugin<TContext>>
  /**
   * Detect server environment
   * Default: `false`
   */
  isDev?: boolean
  /**
   * Context
   */
  context?: (req: Request) => Promise<TContext> | Promise<TContext>
  cors?:
    | ((request: Request) => GraphQLServerCORSOptions)
    | GraphQLServerCORSOptions
    | boolean
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
export class BaseGraphQLServer<TContext> {
  /**
   * Request handler for helix
   */
  public readonly handleRequest = handleRequest
  public readonly schema: GraphQLSchema
  /**
   * Instance of envelop
   */
  public readonly getEnveloped: GetEnvelopedFn<TContext>
  protected isDev: boolean
  public logger: Pick<Console, 'log' | 'debug' | 'error' | 'warn' | 'info'>
  public readonly corsOptionsFactory?: (
    request: Request,
  ) => GraphQLServerCORSOptions
  public readonly graphiql: GraphiQLOptions | false

  constructor(options: BaseGraphQLServerOptions<TContext>) {
    this.schema =
      'schema' in options
        ? options.schema
        : makeExecutableSchema({
            typeDefs: [options.typeDefs, 'scalar File', 'scalar Blob'],
            resolvers: {
              File: GraphQLFile,
              Blob: GraphQLBlob,
              ...options.resolvers,
            },
          })

    this.logger = console
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
      this.graphiql = this.isDev ? {} : false
    }
  }
}

export function createGraphQLServer<TContext>(
  options: BaseGraphQLServerOptions<TContext>,
) {
  return new BaseGraphQLServer<TContext>(options)
}

export const GraphQLBlob = new GraphQLScalarType({
  name: 'Blob',
  serialize: (value) => value,
  parseValue: (value) => value,
  extensions: {
    codegenScalarType: 'Blob',
  },
})

export const GraphQLFile = new GraphQLScalarType({
  name: 'File',
  serialize: (value) => value,
  parseValue: (value) => value,
  extensions: {
    codegenScalarType: 'File',
  },
})
