import { GraphQLSchema, isSchema, print } from 'graphql'
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
  PromiseOrValue,
} from '@envelop/core'
import { useValidationCache, ValidationCache } from '@envelop/validation-cache'
import { ParserCacheOptions, useParserCache } from '@envelop/parser-cache'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { ExecutionResult, IResolvers, TypeSource } from '@graphql-tools/utils'
import {
  CORSOptions,
  GraphQLServerInject,
  YogaInitialContext,
  FetchEvent,
} from './types'
import {
  GraphiQLOptions,
  renderGraphiQL,
  shouldRenderGraphiQL,
} from './graphiql'
import { fetch, Request, Response } from 'cross-undici-fetch'
import { getGraphQLParameters } from './getGraphQLParameters'
import { processRequest } from './processRequest'
import { defaultYogaLogger, YogaLogger } from './logger'

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
export type YogaServerOptions<
  TServerContext extends Record<string, any>,
  TUserContext extends Record<string, any>,
  TRootValue,
> = {
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
    | ((
        initialContext: YogaInitialContext & TServerContext,
      ) => Promise<TUserContext> | TUserContext)
    | Promise<TUserContext>
    | TUserContext
  cors?:
    | ((
        request: Request,
        ...args: {} extends TServerContext
          ? [serverContext?: TServerContext | undefined]
          : [serverContext: TServerContext]
      ) => CORSOptions)
    | CORSOptions
    | boolean

  /**
   * GraphQL endpoint
   */
  endpoint?: string

  /**
   * GraphiQL options
   *
   * Default: `true`
   */
  graphiql?:
    | GraphiQLOptions
    | ((
        request: Request,
        ...args: {} extends TServerContext
          ? [serverContext?: TServerContext | undefined]
          : [serverContext: TServerContext]
      ) => GraphiQLOptions | boolean)
    | boolean

  renderGraphiQL?: (options?: GraphiQLOptions) => PromiseOrValue<BodyInit>

  schema?:
    | GraphQLSchema
    | {
        typeDefs: TypeSource
        resolvers?:
          | IResolvers<
              TRootValue,
              TUserContext & TServerContext & YogaInitialContext
            >
          | Array<
              IResolvers<
                TRootValue,
                TUserContext & TServerContext & YogaInitialContext
              >
            >
      }

  parserCache?: boolean | ParserCacheOptions
  validationCache?: boolean | ValidationCache
} & Partial<
  OptionsWithPlugins<TUserContext & TServerContext & YogaInitialContext>
>

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
export class YogaServer<
  TServerContext extends Record<string, any>,
  TUserContext extends Record<string, any>,
  TRootValue,
> {
  /**
   * Instance of envelop
   */
  public readonly getEnveloped: GetEnvelopedFn<
    TUserContext & TServerContext & YogaInitialContext
  >
  public logger: YogaLogger
  private readonly corsOptionsFactory: (
    request: Request,
    ...args: {} extends TServerContext
      ? [serverContext?: TServerContext | undefined]
      : [serverContext: TServerContext]
  ) => CORSOptions = () => ({})
  protected readonly graphiqlOptionsFactory: (
    request: Request,
    ...args: {} extends TServerContext
      ? [serverContext?: TServerContext | undefined]
      : [serverContext: TServerContext]
  ) => GraphiQLOptions | boolean
  protected endpoint?: string

  renderGraphiQL: (options?: GraphiQLOptions) => PromiseOrValue<BodyInit>

  constructor(
    options?: YogaServerOptions<TServerContext, TUserContext, TRootValue>,
  ) {
    const schema = options?.schema
      ? isSchema(options.schema)
        ? options.schema
        : makeExecutableSchema({
            typeDefs: options.schema.typeDefs,
            resolvers: options.schema.resolvers,
          })
      : getDefaultSchema()

    const logger = options?.logging != null ? options.logging : true
    this.logger =
      typeof logger === 'boolean'
        ? logger === true
          ? defaultYogaLogger
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
        enableIf(options?.parserCache !== false, () =>
          useParserCache(
            typeof options?.parserCache === 'object'
              ? options?.parserCache
              : undefined,
          ),
        ),
        enableIf(options?.validationCache !== false, () =>
          useValidationCache({
            cache:
              typeof options?.validationCache === 'object'
                ? options?.validationCache
                : undefined,
          }),
        ),
        // Log events - useful for debugging purposes
        enableIf(
          logger !== false,
          useLogger({
            logFn: (eventName, events) => {
              this.logger.debug(eventName)
              switch (eventName) {
                case 'execute-start':
                  const {
                    query,
                    variables,
                    operationName,
                  }: YogaInitialContext = events.args.contextValue
                  this.logger.debug(query, 'query')
                  this.logger.debug(operationName, 'headers')
                  this.logger.debug(variables, 'variables')
                  break
                case 'execute-end':
                  this.logger.debug(events.result, 'response')
                  break
              }
            },
          }),
        ),
        enableIf(
          options?.context != null,
          useExtendContext(async (initialContext) => {
            if (options?.context) {
              if (typeof options.context === 'function') {
                return (options.context as Function)(initialContext)
              } else {
                return options.context
              }
            }
          }),
        ),
        ...(options?.plugins ?? []),
        enableIf(
          !!maskedErrors,
          useMaskedErrors(
            typeof maskedErrors === 'object' ? maskedErrors : undefined,
          ),
        ),
      ],
    }) as GetEnvelopedFn<TUserContext & TServerContext & YogaInitialContext>

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

    if (options?.graphiql === true) {
      this.graphiqlOptionsFactory = () => ({})
    } else if (typeof options?.graphiql === 'function') {
      this.graphiqlOptionsFactory = options.graphiql
    } else if (typeof options?.graphiql === 'object') {
      this.graphiqlOptionsFactory = () => options.graphiql as GraphiQLOptions
    } else if (options?.graphiql === false) {
      this.graphiqlOptionsFactory = () => false
    } else {
      this.graphiqlOptionsFactory = () => ({})
    }

    this.renderGraphiQL = options?.renderGraphiQL || renderGraphiQL

    this.endpoint = options?.endpoint
  }

  getCORSResponseHeaders(
    request: Request,
    ...args: {} extends TServerContext
      ? [serverContext?: TServerContext | undefined]
      : [serverContext: TServerContext]
  ): Record<string, string> {
    const corsOptions = this.corsOptionsFactory(request, ...args)

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

  handleOptions(
    request: Request,
    ...args: {} extends TServerContext
      ? [serverContext?: TServerContext | undefined]
      : [serverContext: TServerContext]
  ) {
    const headers = this.getCORSResponseHeaders(request, ...args)

    const optionsResponse = new Response(null, {
      status: 204,
      headers,
    })

    return optionsResponse
  }

  private id = Date.now().toString()

  handleRequest = async (
    request: Request,
    ...args: {} extends TServerContext
      ? [serverContext?: TServerContext | undefined]
      : [serverContext: TServerContext]
  ) => {
    const serverContext = args[0]
    try {
      if (request.method === 'OPTIONS') {
        return this.handleOptions(request, ...args)
      }
      const requestUrl = new URL(request.url)
      if (requestUrl.pathname.endsWith('/health')) {
        return new Response(`{ "message": "alive" }`, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'x-yoga-id': this.id,
          },
        })
      }
      if (requestUrl.pathname.endsWith('/readiness')) {
        const readinessResponse = await fetch(
          request.url.replace('/readiness', '/health'),
        )
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
      if (
        this.endpoint != null &&
        !requestUrl.pathname.endsWith(this.endpoint)
      ) {
        return new Response(
          `Unable to ${request.method} ${requestUrl.pathname}`,
          {
            status: 404,
            statusText: `Not Found`,
          },
        )
      }

      if (shouldRenderGraphiQL(request)) {
        let graphiqlOptions = this.graphiqlOptionsFactory(request, ...args)

        if (graphiqlOptions) {
          const graphiQLBody = await this.renderGraphiQL({
            endpoint: this.endpoint,
            ...(graphiqlOptions === true ? {} : graphiqlOptions),
          })

          return new Response(graphiQLBody, {
            headers: {
              'Content-Type': 'text/html',
            },
            status: 200,
          })
        }
      }

      this.logger.debug(`Extracting GraphQL Parameters`)
      const { query, variables, operationName, extensions } =
        await getGraphQLParameters(request)

      const initialContext = {
        request,
        query,
        variables,
        operationName,
        extensions,
        ...serverContext,
      } as YogaInitialContext & TServerContext
      const { execute, validate, subscribe, parse, contextFactory, schema } =
        this.getEnveloped(initialContext)

      this.logger.debug(`Processing Request`)

      const corsHeaders = this.getCORSResponseHeaders(request, initialContext)
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

  /**
   * Testing utility to mock http request for GraphQL endpoint
   *
   *
   * Example - Test a simple query
   * ```ts
   * const response = await yoga.inject({
   *  document: "query { ping }",
   * })
   * expect(response.statusCode).toBe(200)
   * expect(response.data.ping).toBe('pong')
   * ```
   **/
  async inject<TData = any, TVariables = any>({
    document,
    variables,
    operationName,
    headers,
    serverContext,
  }: GraphQLServerInject<TData, TVariables, TServerContext>): Promise<{
    response: Response
    executionResult: ExecutionResult<TData> | null
  }> {
    const request = new Request('http://localhost/graphql', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query:
          document &&
          (typeof document === 'string' ? document : print(document)),
        variables,
        operationName,
      }),
    })
    const response = await this.handleRequest(
      request,
      serverContext as TServerContext,
    )
    let executionResult: ExecutionResult<TData> | null = null
    if (response.headers.get('content-type') === 'application/json') {
      executionResult = await response.json()
    }
    return {
      response,
      executionResult,
    }
  }

  fetch: WindowOrWorkerGlobalScope['fetch'] = (
    input: RequestInfo,
    init: RequestInit,
  ) => {
    let request: Request
    if (typeof input === 'string') {
      request = new Request(input, init)
    } else {
      request = input
    }
    return this.handleRequest(request, init as any)
  }

  // FetchEvent is not available in all envs
  private fetchEventListener = (event: FetchEvent) =>
    event.respondWith(this.handleRequest(event.request, event as any))

  start() {
    self.addEventListener('fetch', this.fetchEventListener as EventListener)
  }

  stop() {
    self.removeEventListener('fetch', this.fetchEventListener as EventListener)
  }
}

export type YogaServerInstance<TServerContext, TUserContext, TRootValue> =
  YogaServer<TServerContext, TUserContext, TRootValue> &
    (
      | WindowOrWorkerGlobalScope['fetch']
      | ((context: { request: Request }) => Promise<Response>)
    )

export function createServer<
  TServerContext extends Record<string, any> = {},
  TUserContext extends Record<string, any> = {},
  TRootValue = {},
>(
  options?: YogaServerOptions<TServerContext, TUserContext, TRootValue>,
): YogaServerInstance<TServerContext, TUserContext, TRootValue> {
  const server = new YogaServer<TServerContext, TUserContext, TRootValue>(
    options,
  )
  // TODO: Will be removed once we get rid of classes
  const fnHandler = (input: any) => {
    if (input.request) {
      return server.handleRequest(input.request, input as any)
    } else {
      return server.handleRequest(input, undefined as any)
    }
  }
  return new Proxy(fnHandler as any, {
    get: (_, prop) => {
      if (server[prop]) {
        if (server[prop].bind) {
          return server[prop].bind(server)
        }
        return server[prop]
      } else if (fnHandler[prop]) {
        if (fnHandler[prop].bind) {
          return fnHandler[prop].bind(fnHandler)
        }
        return fnHandler[prop]
      }
    },
    apply(_, __, [input]: Parameters<typeof fnHandler>) {
      return fnHandler(input)
    },
  })
}
