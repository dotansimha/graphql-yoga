import { GraphQLSchema, isSchema } from 'graphql'
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
import { fetch, Response } from 'cross-undici-fetch'
import { getGraphQLParameters } from './getGraphQLParameters'
import { processRequest } from './processRequest'

interface OptionsWithPlugins<TContext> {
  /**
   * Envelop Plugins
   * @see https://envelop.dev/plugins
   */
  plugins: Array<Plugin<TContext> | Plugin | {}>
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
   * Prevent leaking unexpected errors to the client. We highly recommend enabling this in production.
   * If you throw `GraphQLYogaError`/`EnvelopError` within your GraphQL resolvers then that error will be sent back to the client.
   *
   * You can lean more about this here:
   * @see https://graphql-yoga.vercel.app/docs/features/error-masking
   *
   * Default: `true`
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
  graphiql?: GraphiQLOptions | false

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
      """
      Greetings from GraphQL Yoga!
      """
      type Query {
        greetings: String
      }
      type Subscription {
        """
        Current Time
        """
        time: String
      }
    `,
    resolvers: {
      Query: {
        greetings: () =>
          'This is the `greetings` field of the root `Query` type',
      },
      Subscription: {
        time: {
          subscribe: async function* () {
            while (true) {
              yield { time: new Date().toISOString() }
              await new Promise((resolve) => setTimeout(resolve, 1000))
            }
          },
        },
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
  private readonly corsOptionsFactory: (request: Request) => CORSOptions =
    () => ({})
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

    const maskedErrors = options?.maskedErrors ?? true

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
        this.corsOptionsFactory = options.cors
      } else if (typeof options.cors === 'object') {
        const corsOptions = {
          ...options.cors,
        }
        this.corsOptionsFactory = () => corsOptions
      }
    }

    this.graphiql =
      options?.graphiql === false || typeof options?.graphiql === 'object'
        ? options.graphiql
        : {}
  }

  getCORSResponseHeaders(request: Request): Record<string, string> {
    const corsOptions = this.corsOptionsFactory(request)

    const headers: Record<string, string> = {}

    headers['Access-Control-Allow-Origin'] = corsOptions.origin
      ? corsOptions.origin.join(', ')
      : request.headers.get('origin') || '*'

    headers['Access-Control-Allow-Methods'] = corsOptions.methods
      ? corsOptions.methods.join(', ')
      : request.headers.get('access-control-request-method') ||
        'GET, POST, OPTIONS'

    headers['Access-Control-Allow-Headers'] = corsOptions.allowedHeaders
      ? corsOptions.allowedHeaders.join(', ')
      : request.headers.get('access-control-request-headers') ||
        'content-type, content-length, accept-encoding'

    headers['Access-Control-Allow-Credentials'] =
      corsOptions.credentials == false ? 'false' : 'true'

    if (corsOptions.exposedHeaders) {
      headers['Access-Control-Expose-Headers'] =
        corsOptions.exposedHeaders.join(', ')
    }

    if (corsOptions.maxAge) {
      headers['Access-Control-Max-Age'] = corsOptions.maxAge.toString()
    }

    headers['Server'] = 'GraphQL Yoga'

    return headers
  }

  handleOptions(request: Request) {
    const headers = this.getCORSResponseHeaders(request)

    const optionsResponse = new Response(null, {
      status: 204,
      headers,
    })

    return optionsResponse
  }

  private id = Date.now().toString()

  handleRequest = async (request: Request) => {
    try {
      if (request.method === 'OPTIONS') {
        return this.handleOptions(request)
      }
      const urlObj = new URL(request.url)
      if (urlObj.pathname === '/health') {
        return new Response(`{ "message": "alive" }`, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'x-yoga-id': this.id,
          },
        })
      }
      if (urlObj.pathname === '/readiness') {
        urlObj.pathname = '/health'
        const readinessResponse = await fetch(urlObj.toString())
        if (
          readinessResponse.status === 200 &&
          readinessResponse.headers.get('x-yoga-id') === this.id
        ) {
          return new Response(`{ "message": "ready" }`, {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          })
        }
        throw new Error(
          `Readiness check failed with status ${readinessResponse.status}`,
        )
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

      const corsHeaders = this.getCORSResponseHeaders(request)
      const response = await processRequest({
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
        extraHeaders: corsHeaders,
      })
      return response
    } catch (err: any) {
      this.logger.error(err.message, err.stack, err)
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
