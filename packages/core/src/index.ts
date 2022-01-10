import {
  CORSOptions,
  GraphiQLOptions,
  handleRequest,
} from '@graphql-yoga/handler'
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
import {
  DisableIntrospectionOptions,
  useDisableIntrospection,
} from '@envelop/disable-introspection'
import { useValidationCache } from '@envelop/validation-cache'
import { useParserCache } from '@envelop/parser-cache'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { IResolvers, TypeSource } from '@graphql-tools/utils'
import { InitialContext } from 'packages/handler/src/types'

const DEFAULT_CORS_OPTIONS: CORSOptions = {
  origin: ['*'],
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  optionsSuccessStatus: 204,
}

export type YogaLogger = Pick<Console, 'debug' | 'error' | 'warn' | 'info'>

interface OptionsWithPlugins<TContext> {
  /**
   * Envelop Plugins
   * @see https://envelop.dev/plugins
   */
  plugins: Array<Plugin<TContext> | 0>
}

/**
 * Configuration options for the server
 */
export type ServerOptions<TContext, TRootValue> = {
  /**
   * Enable logging
   * @default true
   */
  enableLogging?: boolean
  /**
   * Custom logger
   *
   * @default console
   */
  logger?: YogaLogger
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
  disableIntrospection?: boolean | DisableIntrospectionOptions
  /**
   * Prevent leaking unexpected errors to the client. We highly recommend enabling this in production.
   * If you throw `GraphQLYogaError`/`EnvelopError` within your GraphQL resolvers then that error will be sent back to the client.
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
  context?:
    | ((initialContext: InitialContext) => Promise<TContext> | TContext)
    | Promise<TContext>
    | TContext
  cors?: ((request: Request) => CORSOptions) | CORSOptions | boolean
  /**
   * GraphiQL options
   *
   * Default: `true`
   */
  graphiql?: GraphiQLOptions | boolean
} & (
  | ({
      schema: GraphQLSchema
    } & Partial<OptionsWithPlugins<TContext>>)
  | ({
      typeDefs: TypeSource
      resolvers?:
        | IResolvers<TRootValue, TContext>
        | Array<IResolvers<TRootValue, TContext>>
    } & Partial<OptionsWithPlugins<TContext>>)
  | OptionsWithPlugins<TContext>
)

/**
 * Base class that can be extended to create a GraphQL server with any HTTP server framework.
 * @internal
 */
export class Server<TContext extends InitialContext, TRootValue> {
  /**
   * Request handler for helix
   */
  public readonly handleRequest = handleRequest
  /**
   * Instance of envelop
   */
  public readonly getEnveloped: GetEnvelopedFn<TContext>
  public logger: YogaLogger
  public readonly corsOptionsFactory?: (request: Request) => CORSOptions
  public readonly graphiql: GraphiQLOptions | false

  constructor(options: ServerOptions<TContext, TRootValue>) {
    const schema =
      'schema' in options
        ? options.schema
        : 'typeDefs' in options
        ? makeExecutableSchema({
            typeDefs: options.typeDefs,
            resolvers: options.resolvers,
          })
        : null

    this.logger = options.enableLogging
      ? options.logger || console
      : {
          debug: () => {},
          error: () => {},
          warn: () => {},
          info: () => {},
        }

    const maskedErrors = options.maskedErrors || false

    const introspectionDisabled = options.disableIntrospection ?? false

    this.getEnveloped = envelop({
      plugins: [
        // Use the schema provided by the user
        enableIf(schema != null, useSchema(schema!)),
        // Performance things
        useParserCache({
          errorCache: new Map(),
          documentCache: new Map(),
        }),
        useValidationCache({
          cache: new Map(),
        }),
        // Log events - useful for debugging purposes
        enableIf(
          !!options.enableLogging,
          useLogger({
            logFn: (eventName, events) => {
              if (eventName === 'execute-start') {
                const {
                  request: { headers },
                  query,
                  variables,
                }: InitialContext = events.args.contextValue
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
        enableIf(
          !!introspectionDisabled,
          useDisableIntrospection(
            typeof introspectionDisabled === 'boolean'
              ? {}
              : introspectionDisabled,
          ),
        ),
        enableIf(
          !!maskedErrors,
          useMaskedErrors(
            typeof maskedErrors === 'object' ? maskedErrors : undefined,
          ),
        ),
        enableIf(
          options.context != null,
          useExtendContext(
            typeof options.context === 'function'
              ? options.context
              : () => options.context,
          ) as any,
        ),
        ...(options.plugins || []),
      ],
    })

    if (options.cors != null) {
      if (typeof options.cors === 'function') {
        const userProvidedCorsOptionsFactory = options.cors
        this.corsOptionsFactory = (request) => {
          const corsOptions = userProvidedCorsOptionsFactory(request)
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

export function createServer<TContext extends InitialContext, TRootValue>(
  options: ServerOptions<TContext, TRootValue>,
) {
  return new Server<TContext, TRootValue>(options)
}

export { renderGraphiQL } from '@graphql-yoga/handler'
