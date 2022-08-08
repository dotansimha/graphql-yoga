import { ExecutionArgs, GraphQLError, print } from 'graphql'
import {
  GetEnvelopedFn,
  envelop,
  useMaskedErrors,
  UseMaskedErrorsOpts,
  useExtendContext,
  useLogger,
  PromiseOrValue,
  ExecuteFunction,
} from '@envelop/core'
import { useValidationCache, ValidationCache } from '@envelop/validation-cache'
import { ParserCacheOptions, useParserCache } from '@envelop/parser-cache'
import { ExecutionResult, isAsyncIterable } from '@graphql-tools/utils'
import {
  GraphQLServerInject,
  YogaInitialContext,
  FetchAPI,
  GraphQLParams,
  YogaMaskedErrorOpts,
} from './types.js'
import {
  OperationResult,
  OnRequestHook,
  OnRequestParseDoneHook,
  OnRequestParseHook,
  OnResponseHook,
  Plugin,
  RequestParser,
} from './plugins/types.js'
import { createFetch } from '@whatwg-node/fetch'
import { ServerAdapter, createServerAdapter } from '@whatwg-node/server'
import {
  createHandler as createHttpHandler,
  Handler as HttpHandler,
} from '/Users/enisdenjo/Develop/src/github.com/enisdenjo/graphql-http/src' // from 'graphql-http'
import { defaultYogaLogger, titleBold, YogaLogger } from './logger.js'
import { CORSPluginOptions, useCORS } from './plugins/useCORS.js'
import { useHealthCheck } from './plugins/useHealthCheck.js'
import {
  GraphiQLOptions,
  GraphiQLOptionsOrFactory,
  useGraphiQL,
} from './plugins/useGraphiQL.js'
import {
  isPOSTMultipartRequest,
  parsePOSTMultipartRequest,
} from './plugins/requestParser/POSTMultipart.js'
import {
  isPOSTGraphQLStringRequest,
  parsePOSTGraphQLStringRequest,
} from './plugins/requestParser/POSTGraphQLString.js'
import {
  isPOSTFormUrlEncodedRequest,
  parsePOSTFormUrlEncodedRequest,
} from './plugins/requestParser/POSTFormUrlEncoded.js'
import { handleError } from './error.js'
import { useUnhandledRoute } from './plugins/useUnhandledRoute.js'
import { yogaDefaultFormatError } from './utils/yogaDefaultFormatError.js'
import { useSchema, YogaSchemaDefinition } from './plugins/useSchema.js'
import {
  isGETEventStreamRequest,
  parseGETEventStreamRequest,
} from './plugins/requestParser/GETEventStream.js'

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
   * If you throw `EnvelopError`/`GraphQLError` within your GraphQL resolvers then that error will be sent back to the client.
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

  cors?: CORSPluginOptions<TServerContext>

  /**
   * GraphQL endpoint (defaults to '/graphql')
   * So you need to define it explicitly if GraphQL API lives in a different path other than `/graphql`
   */
  graphqlEndpoint?: string

  /**
   * Readiness check endpoint (defaults to '/readiness')
   */
  readinessCheckEndpoint?: string

  /**
   * Readiness check endpoint (defaults to '/readiness')
   */
  healthCheckEndpoint?: string

  /**
   * Whether the landing page should be shown.
   */
  landingPage?: boolean

  /**
   * GraphiQL options
   *
   * Default: `true`
   */
  graphiql?: GraphiQLOptionsOrFactory<TServerContext>

  renderGraphiQL?: (options?: GraphiQLOptions) => PromiseOrValue<BodyInit>

  schema?: YogaSchemaDefinition<
    TUserContext & TServerContext & YogaInitialContext,
    TRootValue
  >

  parserCache?: boolean | ParserCacheOptions
  validationCache?: boolean | ValidationCache
  fetchAPI?: FetchAPI
  multipart?: boolean
  id?: string
} & Partial<
  OptionsWithPlugins<TUserContext & TServerContext & YogaInitialContext>
>

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
  protected graphqlEndpoint: string
  public fetchAPI: FetchAPI
  protected plugins: Array<
    Plugin<TUserContext & TServerContext & YogaInitialContext, TServerContext>
  >
  private onRequestParseHooks: OnRequestParseHook[]
  private onRequestHooks: OnRequestHook<TServerContext>[]
  private onResponseHooks: OnResponseHook<TServerContext>[]
  private maskedErrorsOpts: YogaMaskedErrorOpts | null
  private id: string

  private multipartEnabled: boolean
  private httpHandler: HttpHandler<Request>

  constructor(
    options?: YogaServerOptions<TServerContext, TUserContext, TRootValue>,
  ) {
    this.id = options?.id ?? 'yoga'
    this.fetchAPI =
      options?.fetchAPI ??
      createFetch({
        useNodeFetch: true,
      })

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

    this.maskedErrorsOpts =
      options?.maskedErrors === false
        ? null
        : {
            formatError: yogaDefaultFormatError,
            errorMessage: 'Unexpected error.',
            isDev: globalThis.process?.env?.NODE_ENV === 'development',
            ...(typeof options?.maskedErrors === 'object'
              ? options.maskedErrors
              : {}),
          }

    this.graphqlEndpoint = options?.graphqlEndpoint || '/graphql'

    this.multipartEnabled = !!options?.multipart

    this.plugins = [
      // Use the schema provided by the user
      useSchema(options?.schema),
      // Performance things
      options?.parserCache !== false &&
        useParserCache(
          typeof options?.parserCache === 'object'
            ? options?.parserCache
            : undefined,
        ),
      options?.validationCache !== false &&
        useValidationCache({
          cache:
            typeof options?.validationCache === 'object'
              ? options?.validationCache
              : undefined,
        }),
      // Log events - useful for debugging purposes
      logger !== false &&
        useLogger({
          skipIntrospection: true,
          logFn: (eventName, events) => {
            switch (eventName) {
              case 'execute-start':
              case 'subscribe-start':
                this.logger.debug(titleBold('Execution start'))
                const {
                  query,
                  operationName,
                  variables,
                  extensions,
                }: YogaInitialContext = events.args.contextValue
                this.logger.debug(titleBold('Received GraphQL operation:'))
                this.logger.debug({
                  query,
                  operationName,
                  variables,
                  extensions,
                })
                break
              case 'execute-end':
              case 'subscribe-end':
                this.logger.debug(titleBold('Execution end'))
                this.logger.debug({
                  result: events.result,
                })
                break
            }
          },
        }),
      options?.context != null &&
        useExtendContext(async (initialContext) => {
          if (options?.context) {
            if (typeof options.context === 'function') {
              return (options.context as Function)(initialContext)
            }
            return options.context
          }
        }),
      // Middlewares before processing the incoming HTTP request
      useHealthCheck({
        id: this.id,
        logger: this.logger,
        healthCheckEndpoint: options?.healthCheckEndpoint,
        readinessCheckEndpoint: options?.readinessCheckEndpoint,
      }),
      options?.cors !== false && useCORS(options?.cors),
      options?.graphiql !== false &&
        useGraphiQL({
          graphqlEndpoint: this.graphqlEndpoint,
          options: options?.graphiql,
          render: options?.renderGraphiQL,
          logger: this.logger,
        }),

      ...(options?.plugins ?? []),

      this.maskedErrorsOpts != null && useMaskedErrors(this.maskedErrorsOpts),
      useUnhandledRoute({
        graphqlEndpoint: this.graphqlEndpoint,
        showLandingPage: options?.landingPage ?? true,
      }),
    ]

    this.getEnveloped = envelop({
      plugins: this.plugins,
    }) as GetEnvelopedFn<TUserContext & TServerContext & YogaInitialContext>

    this.onRequestHooks = []
    this.onRequestParseHooks = []
    this.onResponseHooks = []
    for (const plugin of this.plugins) {
      if (plugin) {
        if (plugin.onRequestParse) {
          this.onRequestParseHooks.push(plugin.onRequestParse)
        }
        if (plugin.onRequest) {
          this.onRequestHooks.push(plugin.onRequest)
        }
        if (plugin.onResponse) {
          this.onResponseHooks.push(plugin.onResponse)
        }
      }
    }

    // yoga's envelop may augment the `execute` operation
    // so we need to make sure we always use the freshest instance
    type EnvelopedExecutionArgs = ExecutionArgs & {
      rootValue: {
        execute: ExecuteFunction
      }
    }

    // graphql over http handler for single result operations
    this.httpHandler = createHttpHandler<Request>({
      execute: (args) =>
        (args as EnvelopedExecutionArgs).rootValue.execute(args),
      onSubscribe: async (req, requestParams) => {
        const { params: parsedParams, result } = await this.handleRequestParse(
          req.raw,
        )

        if (result) {
          if (isAsyncIterable(result)) {
            throw new Error('Subscriptions not supported')
          }
          return result
        }

        const params = parsedParams || requestParams
        if (!params.query) {
          return [new GraphQLError('Missing query')]
        }

        const { schema, execute, contextFactory, parse, validate } =
          this.getEnveloped({
            request: req.raw,
            ...params,
            // TODO: include serverContext
          })

        let document
        try {
          document = parse(params.query)
        } catch (err) {
          return [err as GraphQLError]
        }

        const args: EnvelopedExecutionArgs = {
          schema,
          operationName: params.operationName,
          document,
          variableValues: params.variables,
          contextValue: await contextFactory(),
          rootValue: { execute },
        }

        const errors = validate(args.schema, args.document)
        if (errors.length) return errors

        return args
      },
    })
  }

  handleRequest = async (
    request: Request,
    ...args: {} extends TServerContext
      ? [serverContext?: TServerContext | undefined]
      : [serverContext: TServerContext]
  ) => {
    const serverContext = args[0]
    try {
      for (const onRequestHook of this.onRequestHooks) {
        let response: Response | undefined
        await onRequestHook({
          request,
          serverContext,
          fetchAPI: this.fetchAPI,
          endResponse(newResponse) {
            response = newResponse
          },
        })
        if (response) {
          return response
        }
      }

      const response = await (async () => {
        // unofficial but has spec (https://github.com/jaydenseric/graphql-multipart-request-spec)
        if (this.multipartEnabled && isPOSTMultipartRequest(request)) {
          // TODO
          return new this.fetchAPI.Response(null, { status: 501 })
        }

        // unofficial
        if (isPOSTGraphQLStringRequest(request)) {
          // TODO
          return new this.fetchAPI.Response(null, { status: 501 })
        }

        // unofficial
        if (isPOSTFormUrlEncodedRequest(request)) {
          // TODO
          return new this.fetchAPI.Response(null, { status: 501 })
        }

        // unofficial
        if (isGETEventStreamRequest(request)) {
          // TODO
          return new this.fetchAPI.Response(null, { status: 501 })
        }

        // official
        const headers = {}
        request.headers.forEach((value, key) => (headers[key] = value))
        const [body, init] = await this.httpHandler({
          url: request.url,
          method: request.method,
          headers,
          body: await request.text(),
          raw: request,
        })

        // TODO: text encoder with content-length necessary?

        return new this.fetchAPI.Response(body, init)
      })()

      for (const onResponseHook of this.onResponseHooks) {
        await onResponseHook({
          request,
          response,
          serverContext,
        })
      }
      return response
    } catch (e) {
      return new this.fetchAPI.Response('Internal Server Error', {
        status: 500,
      })
    }
  }

  private async handleRequestParse(request: Request): Promise<{
    params: GraphQLParams | null
    result: OperationResult | null
  }> {
    // onRequestParse
    let requestParser: RequestParser | undefined
    const onRequestParseDoneHooks: OnRequestParseDoneHook[] = []
    for (const onRequestParse of this.onRequestParseHooks) {
      const onRequestParseResult = await onRequestParse({
        request,
        requestParser,
        setRequestParser(parser) {
          requestParser = parser
        },
      })
      if (onRequestParseResult?.onRequestParseDone != null) {
        onRequestParseDoneHooks.push(onRequestParseResult.onRequestParseDone)
      }
    }
    if (!requestParser) {
      return { params: null, result: null }
    }

    let params = await requestParser(request)

    // onRequestParseDone
    let result: OperationResult | null = null
    for (const onRequestParseDone of onRequestParseDoneHooks) {
      await onRequestParseDone({
        params,
        setParams(newParams) {
          params = newParams
        },
        setResult(earlyResult) {
          result = earlyResult
        },
      })
      if (result) {
        break
      }
    }

    return { params, result }
  }

  /**
   * Testing utility to mock http request for GraphQL endpoint
   *
   *
   * Example - Test a simple query
   * ```ts
   * const { response, executionResult } = await yoga.inject({
   *  document: "query { ping }",
   * })
   * expect(response.status).toBe(200)
   * expect(executionResult.data.ping).toBe('pong')
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
    const request = new this.fetchAPI.Request(
      'http://localhost' + this.graphqlEndpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          query:
            document &&
            (typeof document === 'string' ? document : print(document)),
          variables,
          operationName,
        }),
      },
    )
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
}

export type YogaServerInstance<TServerContext, TUserContext, TRootValue> =
  ServerAdapter<
    TServerContext,
    YogaServer<TServerContext, TUserContext, TRootValue>
  >

export function createYoga<
  TServerContext extends Record<string, any> = {},
  TUserContext extends Record<string, any> = {},
  TRootValue = {},
>(
  options?: YogaServerOptions<TServerContext, TUserContext, TRootValue>,
): YogaServerInstance<TServerContext, TUserContext, TRootValue> {
  const server = new YogaServer<TServerContext, TUserContext, TRootValue>(
    options,
  )
  return createServerAdapter({
    baseObject: server,
    handleRequest: server.handleRequest as any,
    Request: server.fetchAPI.Request,
  })
}
