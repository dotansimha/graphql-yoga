import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  isSchema,
} from 'graphql'
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
import { CORSOptions, YogaInitialContext, YogaLogger } from './types'
import {
  GraphiQLOptions,
  renderGraphiQL,
  shouldRenderGraphiQL,
} from './graphiql'
import { Response } from 'cross-undici-fetch'
import { getGraphQLParameters } from './getGraphQLParameters'
import { processRequest } from './processRequest'

const DEFAULT_CORS_OPTIONS: CORSOptions = {
  origin: ['*'],
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  optionsSuccessStatus: 204,
}

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
export type YogaServerOptions<TContext, TRootValue> = {
  /**
   * Enable/disable logging or provide a custom logger.
   * @default true
   */
  logging?: boolean | YogaLogger
  /**
   * Disable introspection query. This is useful for exploring the API with tools like GraphiQL.
   * If you are making a private GraphQL API,
   * it is suggested that you set this TRUE in production so that
   * potential malicious API consumers do not see what all operations are possible.
   *
   * You can learn more about GraphQL introspection here:
   * @see https://graphql.org/learn/introspection/
   *
   * Default: `false`
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
    | ((initialContext: YogaInitialContext) => Promise<TContext> | TContext)
    | Promise<TContext>
    | TContext
  cors?: ((request: Request) => CORSOptions) | CORSOptions | boolean
  /**
   * GraphiQL options
   *
   * Default: `true`
   */
  graphiql?: GraphiQLOptions | boolean

  schema?:
    | GraphQLSchema
    | {
        typeDefs: TypeSource
        resolvers?:
          | IResolvers<TRootValue, TContext>
          | Array<IResolvers<TRootValue, TContext>>
      }
} & Partial<OptionsWithPlugins<TContext>>

export function getDefaultSchema() {
  return makeExecutableSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        hello: String
      }
    `,
    resolvers: {
      Query: {
        hello: () => 'world',
      },
    },
  })
}

/**
 * Base class that can be extended to create a GraphQL server with any HTTP server framework.
 * @internal
 */
export class YogaServer<TContext extends YogaInitialContext, TRootValue> {
  /**
   * Instance of envelop
   */
  public readonly getEnveloped: GetEnvelopedFn<TContext>
  public logger: YogaLogger
  private readonly corsOptionsFactory: (request: Request) => CORSOptions = () =>
    DEFAULT_CORS_OPTIONS
  protected readonly graphiql: GraphiQLOptions | false

  constructor(options?: YogaServerOptions<TContext, TRootValue>) {
    const schema = options?.schema
      ? isSchema(options.schema)
        ? options.schema
        : makeExecutableSchema({
            typeDefs: options.schema.typeDefs,
            resolvers: options.schema.resolvers,
          })
      : getDefaultSchema()

    const logger = options?.logging ?? true
    this.logger =
      typeof logger === 'boolean'
        ? logger === true
          ? console
          : {
              debug: () => {},
              error: () => {},
              warn: () => {},
              info: () => {},
            }
        : logger

    const maskedErrors = options?.maskedErrors ?? false

    const introspectionDisabled = options?.disableIntrospection ?? false

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
          !!logger,
          useLogger({
            logFn: (eventName, events) => {
              switch (eventName) {
                case 'execute-start':
                  const {
                    query,
                    variables,
                    operationName,
                  }: YogaInitialContext = events.args.contextValue
                  this.logger.debug(eventName)
                  this.logger.debug(query, 'query')
                  this.logger.debug(operationName, 'headers')
                  this.logger.debug(variables, 'variables')
                  break
                case 'execute-end':
                  this.logger.debug(eventName)
                  this.logger.debug(events.result, 'response')
                  break
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
          options?.context != null,
          useExtendContext(
            typeof options?.context === 'function'
              ? options?.context
              : () => options?.context,
          ) as any,
        ),
        ...(options?.plugins ?? []),
      ],
    })

    if (options?.cors != null) {
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
      }
    }

    if (typeof options?.graphiql === 'object' || options?.graphiql === false) {
      this.graphiql = options.graphiql
    } else {
      this.graphiql = introspectionDisabled ? false : {}
    }
  }

  handleOptions(request: Request) {
    const corsOptions = this.corsOptionsFactory(request)
    const headers: HeadersInit = {}
    if (corsOptions.origin) {
      headers['Access-Control-Allow-Origin'] = corsOptions.origin.join(', ')
    }

    if (corsOptions.methods) {
      headers['Access-Control-Allow-Methods'] = corsOptions.methods.join(', ')
    }

    if (corsOptions.allowedHeaders) {
      headers['Access-Control-Allow-Headers'] =
        corsOptions.allowedHeaders.join(', ')
    }

    if (corsOptions.exposedHeaders) {
      headers['Access-Control-Expose-Headers'] =
        corsOptions.exposedHeaders.join(', ')
    }

    if (corsOptions.credentials) {
      headers['Access-Control-Allow-Credentials'] = 'true'
    }

    if (corsOptions.maxAge) {
      headers['Access-Control-Max-Age'] = corsOptions.maxAge.toString()
    }

    return new Response(null, {
      headers,
      status: corsOptions.optionsSuccessStatus,
    })
  }

  async handleRequest(request: Request) {
    try {
      if (request.method === 'OPTIONS') {
        return this.handleOptions(request)
      }

      this.logger.debug(`Checking if GraphiQL Request`)
      if (shouldRenderGraphiQL(request) && this.graphiql) {
        const graphiQLBody = renderGraphiQL(this.graphiql)
        return new Response(graphiQLBody, {
          headers: {
            'Content-Type': 'text/html',
          },
          status: 200,
        })
      }

      this.logger.debug(`Extracting GraphQL Parameters`)
      const { query, variables, operationName } = await getGraphQLParameters(
        request,
      )

      const { execute, validate, subscribe, parse, contextFactory, schema } =
        this.getEnveloped<YogaInitialContext>({
          request,
          query,
          variables,
          operationName,
        })

      this.logger.debug(`Processing Request by Helix`)

      return await processRequest({
        request,
        query,
        variables,
        operationName,
        execute,
        validate,
        subscribe,
        parse,
        contextFactory,
        schema,
      })
    } catch (err: any) {
      this.logger.error(err.message, err)
      const response = new Response(err.message, {
        status: 500,
        statusText: 'Internal Server Error',
      })
      return response
    }
  }
}

export function createServer<TContext extends YogaInitialContext, TRootValue>(
  options?: YogaServerOptions<TContext, TRootValue>,
) {
  return new YogaServer<TContext, TRootValue>(options)
}

export { renderGraphiQL }
