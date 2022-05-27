import { GraphQLSchema, isSchema, print } from 'graphql'
import {
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
  GraphQLServerInject,
  YogaInitialContext,
  FetchEvent,
  FetchAPI,
  GraphQLParams,
} from './types'
import {
  OnRequestHook,
  OnRequestParseDoneHook,
  OnRequestParseHook,
  OnResponseHook,
  OnResultProcess,
  Plugin,
  RequestParser,
  ResultProcessor,
} from './plugins/types'
import * as crossUndiciFetch from 'cross-undici-fetch'
import {
  getErrorResponse,
  processRequest as processGraphQLParams,
} from './processRequest'
import { defaultYogaLogger, titleBold, YogaLogger } from './logger'
import { CORSPluginOptions, useCORS } from './plugins/useCORS'
import { useHealthCheck } from './plugins/useHealthCheck'
import {
  GraphiQLOptions,
  GraphiQLOptionsOrFactory,
  useGraphiQL,
} from './plugins/useGraphiQL'
import { useRequestParser } from './plugins/useRequestParser'
import { isGETRequest, parseGETRequest } from './plugins/requestParser/GET'
import {
  isPOSTJsonRequest,
  parsePOSTJsonRequest,
} from './plugins/requestParser/POSTJson'
import {
  isPOSTMultipartRequest,
  parsePOSTMultipartRequest,
} from './plugins/requestParser/POSTMultipart'
import {
  isPOSTGraphQLStringRequest,
  parsePOSTGraphQLStringRequest,
} from './plugins/requestParser/POSTGraphQLString'
import { useResultProcessor } from './plugins/useResultProcessor'
import {
  isRegularResult,
  processRegularResult,
} from './plugins/resultProcessor/regular'
import { isPushResult, processPushResult } from './plugins/resultProcessor/push'
import {
  isMultipartResult,
  processMultipartResult,
} from './plugins/resultProcessor/multipart'
import {
  isPOSTFormUrlEncodedRequest,
  parsePOSTFormUrlEncodedRequest,
} from './plugins/requestParser/POSTFormUrlEncoded'

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

  cors?: CORSPluginOptions<TServerContext>

  /**
   * GraphQL endpoint
   */
  endpoint?: string

  /**
   * GraphiQL options
   *
   * Default: `true`
   */
  graphiql?: GraphiQLOptionsOrFactory<TServerContext>

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
  fetchAPI?: Partial<FetchAPI>
  multipart?: boolean
  id?: string
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
          async *subscribe() {
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
  protected endpoint?: string
  protected fetchAPI: FetchAPI
  protected plugins: Array<
    Plugin<TUserContext & TServerContext & YogaInitialContext, TServerContext>
  >
  private onRequestParseHooks: OnRequestParseHook<TServerContext>[]
  private onRequestHooks: OnRequestHook<TServerContext>[]
  private onResultProcessHooks: OnResultProcess<
    TUserContext & TServerContext & YogaInitialContext
  >[]
  private onResponseHooks: OnResponseHook<TServerContext>[]
  private id: string

  constructor(
    options?: YogaServerOptions<TServerContext, TUserContext, TRootValue>,
  ) {
    this.id = options?.id ?? 'yoga'
    this.fetchAPI = {
      Request: options?.fetchAPI?.Request ?? crossUndiciFetch.Request,
      Response: options?.fetchAPI?.Response ?? crossUndiciFetch.Response,
      fetch: options?.fetchAPI?.fetch ?? crossUndiciFetch.fetch,
      ReadableStream:
        options?.fetchAPI?.ReadableStream ?? crossUndiciFetch.ReadableStream,
    }
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

    const server = this
    this.endpoint = options?.endpoint

    this.plugins = [
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
                if (query) {
                  this.logger.debug(
                    '\n' + titleBold('Received GraphQL operation:') + '\n',
                    query,
                  )
                }
                if (operationName) {
                  this.logger.debug('\t operationName:', operationName)
                }
                if (variables) {
                  this.logger.debug('\t variables:', variables)
                }
                if (extensions) {
                  this.logger.debug('\t extensions:', extensions)
                }
                break
              case 'execute-end':
              case 'subscribe-end':
                this.logger.debug(titleBold('Execution end'))
                this.logger.debug('\t result:', events.result)
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
            }
            return options.context
          }
        }),
      ),
      // Middlewares before processing the incoming HTTP request
      useHealthCheck({
        id: this.id,
        logger: this.logger,
      }),
      enableIf(options?.graphiql !== false, () =>
        useGraphiQL({
          get endpoint() {
            return server.endpoint
          },
          options: options?.graphiql,
          render: options?.renderGraphiQL,
          logger: this.logger,
        }),
      ),
      enableIf(options?.cors !== false, () => useCORS(options?.cors)),
      // Middlewares before the GraphQL execution
      useRequestParser({
        match: isGETRequest,
        parse: parseGETRequest,
      }),
      useRequestParser({
        match: isPOSTJsonRequest,
        parse: parsePOSTJsonRequest,
      }),
      enableIf(options?.multipart !== false, () =>
        useRequestParser({
          match: isPOSTMultipartRequest,
          parse: parsePOSTMultipartRequest,
        }),
      ),
      useRequestParser({
        match: isPOSTGraphQLStringRequest,
        parse: parsePOSTGraphQLStringRequest,
      }),
      useRequestParser({
        match: isPOSTFormUrlEncodedRequest,
        parse: parsePOSTFormUrlEncodedRequest,
      }),
      // Middlewares after the GraphQL execution
      useResultProcessor({
        match: isRegularResult,
        processResult: processRegularResult as ResultProcessor,
      }),
      useResultProcessor({
        match: isPushResult,
        processResult: processPushResult as ResultProcessor,
      }),
      useResultProcessor({
        match: isMultipartResult,
        processResult: processMultipartResult as ResultProcessor,
      }),
      ...(options?.plugins ?? []),
      enableIf(
        !!maskedErrors,
        useMaskedErrors(
          typeof maskedErrors === 'object' ? maskedErrors : undefined,
        ),
      ),
    ]

    this.getEnveloped = envelop({
      plugins: this.plugins,
    }) as GetEnvelopedFn<TUserContext & TServerContext & YogaInitialContext>

    this.onRequestHooks = []
    this.onRequestParseHooks = []
    this.onResultProcessHooks = []
    this.onResponseHooks = []
    for (const plugin of this.plugins) {
      if (plugin) {
        if (plugin.onRequestParse) {
          this.onRequestParseHooks.push(plugin.onRequestParse)
        }
        if (plugin.onRequest) {
          this.onRequestHooks.push(plugin.onRequest)
        }
        if (plugin.onResultProcess) {
          this.onResultProcessHooks.push(plugin.onResultProcess)
        }
        if (plugin.onResponse) {
          this.onResponseHooks.push(plugin.onResponse)
        }
      }
    }
  }

  async getResponse(
    request: Request,
    ...args: {} extends TServerContext
      ? [serverContext?: TServerContext | undefined]
      : [serverContext: TServerContext]
  ) {
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

      let requestParser: RequestParser | undefined
      const onRequestParseDoneList: OnRequestParseDoneHook[] = []

      for (const onRequestParse of this.onRequestParseHooks) {
        const onRequestParseResult = await onRequestParse({
          serverContext,
          request,
          requestParser,
          setRequestParser(parser: RequestParser) {
            requestParser = parser
          },
        })
        if (onRequestParseResult?.onRequestParseDone != null) {
          onRequestParseDoneList.push(onRequestParseResult.onRequestParseDone)
        }
      }

      this.logger.debug(`Parsing request to extract GraphQL parameters`)

      if (!requestParser) {
        return new this.fetchAPI.Response('Request is not valid', {
          status: 400,
          statusText: 'Bad Request',
        })
      }

      let params: GraphQLParams<Record<string, any>, Record<string, any>>
      try {
        params = await requestParser(request)
      } catch (err: unknown) {
        if (err instanceof Error) {
          return getErrorResponse({
            status: 400,
            errors: [err],
            fetchAPI: this.fetchAPI,
          })
        }
        throw err
      }

      for (const onRequestParseDone of onRequestParseDoneList) {
        await onRequestParseDone({
          params,
          setParams(newParams: GraphQLParams) {
            params = newParams
          },
        })
      }

      const initialContext = {
        request,
        ...params,
        ...serverContext,
      } as YogaInitialContext & TServerContext

      const enveloped = this.getEnveloped(initialContext)

      this.logger.debug(`Processing GraphQL Parameters`)

      const result = await processGraphQLParams({
        request,
        params,
        enveloped,
        fetchAPI: this.fetchAPI,
        onResultProcessHooks: this.onResultProcessHooks,
      })

      return result
    } catch (error: unknown) {
      return getErrorResponse({
        status: 500,
        errors: [new Error((error as Error)?.message ?? 'Unexpected Error.')],
        fetchAPI: this.fetchAPI,
      })
    }
  }

  handleRequest = async (
    request: Request,
    ...args: {} extends TServerContext
      ? [serverContext?: TServerContext | undefined]
      : [serverContext: TServerContext]
  ) => {
    const response = await this.getResponse(request, ...args)

    for (const onResponseHook of this.onResponseHooks) {
      await onResponseHook({
        request,
        response,
        serverContext: args[0],
      })
    }
    return response
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
    const request = new this.fetchAPI.Request('http://localhost/graphql', {
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
      request = new this.fetchAPI.Request(input, init)
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
    }
    return server.handleRequest(input, undefined as any)
  }
  return new Proxy(fnHandler as any, {
    get: (_, prop) => {
      if (server[prop]) {
        if (server[prop].bind) {
          return server[prop].bind(server)
        }
        return server[prop]
      }
      if (fnHandler[prop]) {
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
