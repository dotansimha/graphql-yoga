import { ExecutionArgs, getOperationAST, GraphQLError, print } from 'graphql'
import {
  GetEnvelopedFn,
  envelop,
  useMaskedErrors,
  UseMaskedErrorsOpts,
  useExtendContext,
  useLogger,
  PromiseOrValue,
  ExecuteFunction,
  SubscribeFunction,
} from '@envelop/core'
import { useValidationCache, ValidationCache } from '@envelop/validation-cache'
import { ParserCacheOptions, useParserCache } from '@envelop/parser-cache'
import {
  ExecutionResult,
  isAsyncIterable,
  parseSelectionSet,
} from '@graphql-tools/utils'
import { dset } from 'dset'
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
  OnPrepareHook,
  OnResponseHook,
  Plugin,
} from './plugins/types.js'
import { createFetch } from '@whatwg-node/fetch'
import { ServerAdapter, createServerAdapter } from '@whatwg-node/server'
import {
  getAcceptableMediaType,
  createHandler as createHttpHandler,
  Handler as HttpHandler,
  makeResponse as makeHttpResponse,
  AcceptableMediaType,
} from '/Users/enisdenjo/Develop/src/github.com/enisdenjo/graphql-http/src' // from 'graphql-http'
import { defaultYogaLogger, titleBold, YogaLogger } from './logger.js'
import { CORSPluginOptions, useCORS } from './plugins/useCORS.js'
import { useHealthCheck } from './plugins/useHealthCheck.js'
import {
  GraphiQLOptions,
  GraphiQLOptionsOrFactory,
  useGraphiQL,
} from './plugins/useGraphiQL.js'
import { handleError } from './error.js'
import { useUnhandledRoute } from './plugins/useUnhandledRoute.js'
import { yogaDefaultFormatError } from './utils/yogaDefaultFormatError.js'
import { useSchema, YogaSchemaDefinition } from './plugins/useSchema.js'
import { isContentTypeMatch, parseURLSearchParams } from './utils/request.js'

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
  private onRequestHooks: OnRequestHook<TServerContext>[]
  private onPrepareHooks: OnPrepareHook[]
  private onResponseHooks: OnResponseHook<TServerContext>[]
  private maskedErrorsOpts: YogaMaskedErrorOpts | null
  private id: string

  private multipartEnabled: boolean
  private httpHandler: HttpHandler<Request, TServerContext>

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
      !!options?.schema && useSchema(options?.schema),
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
    this.onPrepareHooks = []
    this.onResponseHooks = []
    for (const plugin of this.plugins) {
      if (plugin) {
        if (plugin.onRequest) {
          this.onRequestHooks.push(plugin.onRequest)
        }
        if (plugin.onPrepare) {
          this.onPrepareHooks.push(plugin.onPrepare)
        }
        if (plugin.onResponse) {
          this.onResponseHooks.push(plugin.onResponse)
        }
      }
    }

    this.httpHandler = createHttpHandler<Request, TServerContext>({
      execute: (args) => (args as any).rootValue.execute(args),
      onSubscribe: async (req, params) => {
        const { errors, args, result } = await this.handlePrepare(
          req.raw,
          params,
          req.context,
        )
        if (errors) {
          return errors
        }
        if (isAsyncIterable(result)) {
          return [new GraphQLError('Subscriptions are not supported')]
        }
        if (!args) {
          // should never happen at this point
          throw new Error('Missing operation arguments')
        }
        return args
      },
    })
  }

  public handleRequest = async (
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
        let params: GraphQLParams | null,
          acceptedMediaType:
            | AcceptableMediaType
            | 'multipart/mixed'
            | 'text/event-stream'
            | null,
          resultToResponse: (
            result: OperationResult,
            acceptedMediaType:
              | AcceptableMediaType
              | 'multipart/mixed'
              | 'text/event-stream',
          ) => Response
        if ((params = await this.parseUrlEncodedInBodyRequest(request))) {
          // unofficial
          resultToResponse = this.resultToRegularResponse
          acceptedMediaType = getAcceptableMediaType(
            request.headers.get('accept'),
          )
        } else if ((params = await this.parseGraphQLStringRequest(request))) {
          // unofficial
          resultToResponse = this.resultToRegularResponse
          acceptedMediaType = getAcceptableMediaType(
            request.headers.get('accept'),
          )
        } else if ((params = await this.parseMultipartRequest(request))) {
          // unofficial
          resultToResponse = this.resultToMultipartResponse
          acceptedMediaType = 'multipart/mixed'
        } else if ((params = await this.parseEventStreamRequest(request))) {
          // unofficial
          resultToResponse = this.resultToEventStreamResponse
          acceptedMediaType = 'text/event-stream'
        } else {
          // official (or invalid)
          const headers = {}
          request.headers.forEach((value, key) => (headers[key] = value))
          const [body, init] = await this.httpHandler({
            url: request.url,
            method: request.method,
            headers,
            body: await request.text(),
            raw: request,
            context: serverContext as TServerContext,
          })
          // TODO: text encoder with content-length necessary?
          return new this.fetchAPI.Response(body, init)
        }

        if (!acceptedMediaType) {
          return new this.fetchAPI.Response(null, {
            status: 406,
            statusText: 'Not Acceptable',
            headers: {
              accept:
                'application/graphql+json; charset=utf-8, application/json; charset=utf-8, text/event-stream; charset=utf-8',
            },
          })
        }

        const { errors, result, args } = await this.handlePrepare(
          request,
          params,
          serverContext as TServerContext,
        )
        if (errors) {
          return resultToResponse({ errors }, acceptedMediaType)
        }
        if (result) {
          return resultToResponse(result, acceptedMediaType)
        }

        if (!args) {
          // should never happen at this point
          throw new Error('Missing operation arguments')
        }

        const operation = getOperationAST(args.document, args.operationName)
        if (operation?.operation === 'subscription') {
          return resultToResponse(
            await args.rootValue.subscribe(args),
            acceptedMediaType,
          )
        }
        return resultToResponse(
          await args.rootValue.execute(args),
          acceptedMediaType,
        )
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
      const acceptedMediaType = getAcceptableMediaType(
        request.headers.get('accept'),
      )
      return new this.fetchAPI.Response(
        JSON.stringify({ errors: handleError(e, this.maskedErrorsOpts, []) }),
        {
          status:
            e instanceof GraphQLError
              ? // graphql errors are considered as client's fault
                acceptedMediaType === 'application/json'
                ? 200
                : 400
              : // all other errors are probably unhandled and are the server's fault
                500,
          headers: {
            'content-type':
              acceptedMediaType === 'application/graphql+json'
                ? 'application/graphql+json; charset=utf-8'
                : 'application/json; charset=utf-8',
          },
        },
      )
    }
  }

  private handlePrepare = async (
    request: Request,
    params: GraphQLParams,
    serverContext: TServerContext,
  ): Promise<{
    errors: readonly GraphQLError[] | null
    result: OperationResult | null
    args:
      | (ExecutionArgs & {
          rootValue: {
            execute: ExecuteFunction
            subscribe: SubscribeFunction
          }
        })
      | null
  }> => {
    let result: OperationResult | null = null
    for (const onPrepare of this.onPrepareHooks) {
      await onPrepare({
        request,
        params,
        setParams(newParams) {
          params = newParams
        },
        setResult(earlyResult) {
          result = earlyResult
        },
      })
      if (result) {
        return {
          errors: null,
          result,
          args: null,
        }
      }
    }

    if (!params.query) {
      return {
        errors: [new GraphQLError('Missing query')],
        result: null,
        args: null,
      }
    }

    const { schema, execute, subscribe, contextFactory, parse, validate } =
      this.getEnveloped({
        request,
        ...params,
        ...serverContext,
      })

    if (!schema) {
      throw new Error('Missing schema')
    }

    let document
    try {
      document = parse(params.query)
    } catch (err) {
      return {
        errors: [err as GraphQLError],
        result: null,
        args: null,
      }
    }

    const errors = validate(schema, document)
    if (errors.length) {
      return {
        errors,
        result: null,
        args: null,
      }
    }

    return {
      errors: null,
      result: null,
      args: {
        schema,
        operationName: params.operationName,
        document,
        variableValues: params.variables,
        contextValue: await contextFactory(),
        rootValue: {
          execute,
          subscribe,
        },
      },
    }
  }

  private parseUrlEncodedInBodyRequest = async (
    request: Request,
  ): Promise<GraphQLParams | null> => {
    if (
      request.method === 'POST' &&
      isContentTypeMatch(request, 'application/x-www-form-urlencoded')
    ) {
      const requestBody = await request.text()
      return parseURLSearchParams(requestBody)
    }
    return null
  }

  private parseGraphQLStringRequest = async (
    request: Request,
  ): Promise<GraphQLParams | null> => {
    if (
      request.method === 'POST' &&
      isContentTypeMatch(request, 'application/graphql')
    ) {
      return {
        query: await request.text(),
      }
    }
    return null
  }

  private parseMultipartRequest = async (
    request: Request,
  ): Promise<GraphQLParams | null> => {
    if (!request.headers.get('accept')?.includes('multipart/mixed')) {
      return null
    }
    if (request.method === 'GET') {
      return parseURLSearchParams(request.url.split('?')[1])
    }
    if (
      request.method === 'POST' &&
      isContentTypeMatch(request, 'application/json')
    ) {
      return await request.json()
    }

    // https://github.com/jaydenseric/graphql-multipart-request-spec
    if (!this.multipartEnabled) {
      return null
    }
    let requestBody: FormData
    try {
      requestBody = await request.formData()
    } catch (e: unknown) {
      // Trick for @whatwg-node/fetch errors on Node.js
      // TODO: This needs a better solution
      if (
        e instanceof Error &&
        e.message.startsWith('File size limit exceeded: ')
      ) {
        throw new GraphQLError(e.message)
      }
      throw e
    }

    const operationsStr = requestBody.get('operations')?.toString() || '{}'
    const operations = JSON.parse(operationsStr)
    const mapStr = requestBody.get('map')?.toString() || '{}'
    const map = JSON.parse(mapStr)
    for (const fileIndex in map) {
      const file = requestBody.get(fileIndex)
      const keys = map[fileIndex]
      for (const key of keys) {
        dset(operations, key, file)
      }
    }

    return {
      operationName: operations.operationName,
      query: operations.query,
      variables: operations.variables,
      extensions: operations.extensions,
    }
  }

  private parseEventStreamRequest = async (
    request: Request,
  ): Promise<GraphQLParams | null> => {
    if (!request.headers.get('accept')?.includes('text/event-stream')) {
      return null
    }
    if (request.method === 'GET') {
      return parseURLSearchParams(request.url.split('?')[1])
    }
    if (
      request.method === 'POST' &&
      isContentTypeMatch(request, 'application/json')
    ) {
      return await request.json()
    }
    return null
  }

  private resultToEventStreamResponse = (result: OperationResult): Response => {
    let iterator: AsyncIterator<ExecutionResult<any>>
    const textEncoder = new this.fetchAPI.TextEncoder()
    const readableStream = new this.fetchAPI.ReadableStream({
      start() {
        if (isAsyncIterable(result)) {
          iterator = result[Symbol.asyncIterator]()
        } else {
          let finished = false
          iterator = {
            next: () => {
              if (finished) {
                return Promise.resolve({ done: true, value: null })
              }
              finished = true
              return Promise.resolve({ done: false, value: result })
            },
          }
        }
      },
      async pull(controller) {
        const { done, value } = await iterator.next()
        if (value != null) {
          const chunk = JSON.stringify(value)
          controller.enqueue(textEncoder.encode(`data: ${chunk}\n\n`))
        }
        if (done) {
          controller.close()
        }
      },
      async cancel(e) {
        await iterator.return?.(e)
      },
    })
    return new this.fetchAPI.Response(readableStream, {
      status: 200,
      headers: {
        'content-type': 'text/event-stream',
        connection: 'keep-alive',
        'cache-control': 'no-cache',
        'content-encoding': 'none',
      },
    })
  }

  private resultToMultipartResponse = (result: OperationResult): Response => {
    let iterator: AsyncIterator<ExecutionResult<any>>
    const textEncoder = new this.fetchAPI.TextEncoder()
    const readableStream = new this.fetchAPI.ReadableStream({
      start(controller) {
        if (isAsyncIterable(result)) {
          iterator = result[Symbol.asyncIterator]()
        } else {
          let finished = false
          iterator = {
            next: () => {
              if (finished) {
                return Promise.resolve({ done: true, value: null })
              }
              finished = true
              return Promise.resolve({ done: false, value: result })
            },
          }
        }
        controller.enqueue(textEncoder.encode(`---`))
      },
      async pull(controller) {
        const { done, value } = await iterator.next()
        if (value != null) {
          controller.enqueue(textEncoder.encode('\r\n'))

          controller.enqueue(
            textEncoder.encode('Content-Type: application/json; charset=utf-8'),
          )
          controller.enqueue(textEncoder.encode('\r\n'))

          const chunk = JSON.stringify(value)
          const encodedChunk = textEncoder.encode(chunk)

          controller.enqueue(
            textEncoder.encode('Content-Length: ' + encodedChunk.byteLength),
          )
          controller.enqueue(textEncoder.encode('\r\n'))

          controller.enqueue(textEncoder.encode('\r\n'))
          controller.enqueue(encodedChunk)
          controller.enqueue(textEncoder.encode('\r\n'))

          controller.enqueue(textEncoder.encode('---'))
        }
        if (done) {
          controller.enqueue(textEncoder.encode('\r\n-----\r\n'))
          controller.close()
        }
      },
      async cancel(e) {
        await iterator.return?.(e)
      },
    })
    return new this.fetchAPI.Response(readableStream, {
      status: 200,
      headers: {
        connection: 'keep-alive',
        'content-type': 'multipart/mixed; boundary="-"',
        'transfer-encoding': 'chunked',
      },
    })
  }

  private resultToRegularResponse = (
    result: OperationResult,
    acceptedMediaType:
      | AcceptableMediaType
      | 'multipart/mixed'
      | 'text/event-stream',
  ): Response => {
    if (
      acceptedMediaType === 'multipart/mixed' ||
      acceptedMediaType === 'text/event-stream'
    ) {
      throw new Error(
        `Unaccaptable media-type ${acceptedMediaType} to a regular request`,
      )
    }
    if (isAsyncIterable(result)) {
      return new this.fetchAPI.Response(
        ...makeHttpResponse(
          [new GraphQLError('Subscriptions are not supported')],
          acceptedMediaType,
        ),
      )
    }
    return new this.fetchAPI.Response(
      ...makeHttpResponse(result, acceptedMediaType),
    )
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
  public async inject<TData = any, TVariables = any>({
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
