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
} from './types.js'
import {
  OnRequestHook,
  OnRequestParseDoneHook,
  OnRequestParseHook,
  OnResponseHook,
  OnResultProcess,
  Plugin,
  RequestParser,
  ResultProcessor,
} from './plugins/types.js'
import * as crossUndiciFetch from '@whatwg-node/fetch'
import { processRequest as processGraphQLParams } from './processRequest.js'
import { defaultYogaLogger, titleBold, YogaLogger } from './logger.js'
import { CORSPluginOptions, useCORS } from './plugins/useCORS.js'
import { useHealthCheck } from './plugins/useHealthCheck.js'
import {
  GraphiQLOptions,
  GraphiQLOptionsOrFactory,
  useGraphiQL,
} from './plugins/useGraphiQL.js'
import { useRequestParser } from './plugins/useRequestParser.js'
import { isGETRequest, parseGETRequest } from './plugins/requestParser/GET.js'
import {
  isPOSTJsonRequest,
  parsePOSTJsonRequest,
} from './plugins/requestParser/POSTJson.js'
import {
  isPOSTMultipartRequest,
  parsePOSTMultipartRequest,
} from './plugins/requestParser/POSTMultipart.js'
import {
  isPOSTGraphQLStringRequest,
  parsePOSTGraphQLStringRequest,
} from './plugins/requestParser/POSTGraphQLString.js'
import { useResultProcessor } from './plugins/useResultProcessor.js'
import {
  isRegularResult,
  processRegularResult,
} from './plugins/resultProcessor/regular.js'
import {
  isPushResult,
  processPushResult,
} from './plugins/resultProcessor/push.js'
import {
  isMultipartResult,
  processMultipartResult,
} from './plugins/resultProcessor/multipart.js'
import {
  isPOSTFormUrlEncodedRequest,
  parsePOSTFormUrlEncodedRequest,
} from './plugins/requestParser/POSTFormUrlEncoded.js'
import { handleError } from './GraphQLYogaError.js'
import { encodeString } from './encodeString.js'
import { useCheckMethodForGraphQL } from './plugins/requestValidation/useCheckMethodForGraphQL.js'
import { useCheckGraphQLQueryParam } from './plugins/requestValidation/useCheckGraphQLQueryParam.js'
import { useHTTPValidationError } from './plugins/requestValidation/useHTTPValidationError.js'
import { usePreventMutationViaGET } from './plugins/requestValidation/usePreventMutationViaGET.js'

interface OptionsWithPlugins<TContext extends Record<string, any>> {
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
  private onRequestParseHooks: OnRequestParseHook[]
  private onRequestHooks: OnRequestHook<TServerContext>[]
  private onResultProcessHooks: OnResultProcess[]
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
      useCheckMethodForGraphQL(),
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
      useCheckGraphQLQueryParam(),
      // To make sure those are called at the end
      {
        onPluginInit({ addPlugin }) {
          addPlugin(
            // We make sure that the user doesn't send a mutation with GET
            usePreventMutationViaGET(),
          )
          if (!!maskedErrors) {
            addPlugin(
              useMaskedErrors(
                typeof maskedErrors === 'object' ? maskedErrors : undefined,
              ),
            )
          }
          addPlugin(
            // We handle validation errors at the end
            useHTTPValidationError(),
          )
        },
      },
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

      let params = await requestParser(request)

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
      }

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
      const finalResponseInit = {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      const errors = handleError(error)
      for (const error of errors) {
        if (error.extensions?.http) {
          if (
            error.extensions.http.status &&
            error.extensions?.http.status > finalResponseInit.status
          ) {
            finalResponseInit.status = error.extensions.http.status
          }
          if (error.extensions.http.headers) {
            Object.assign(
              finalResponseInit.headers,
              error.extensions.http.headers,
            )
          }
          // Remove http extensions from the final response
          error.extensions.http = undefined
        }
      }

      const payload: ExecutionResult = {
        data: null,
        errors,
      }
      const decodedString = encodeString(JSON.stringify(payload))
      finalResponseInit.headers['Content-Length'] =
        decodedString.byteLength.toString()
      return new this.fetchAPI.Response(decodedString, finalResponseInit)
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
    const request = new this.fetchAPI.Request('http://localhost/graphql', {
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

export type YogaServerInstance<
  TServerContext extends Record<string, any>,
  TUserContext extends Record<string, any>,
  TRootValue,
> = YogaServer<TServerContext, TUserContext, TRootValue> &
  (
    | WindowOrWorkerGlobalScope['fetch']
    | ((request: Request, serverContext?: TServerContext) => Promise<Response>)
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
  const fnHandler = (input: any, ctx: any) => {
    // Is input a container object over Request?
    if (input.request) {
      // In this input is also the context
      return server.handleRequest(input.request, input)
    }
    // Or is it Request itself?
    // Then ctx is present and it is the context
    return server.handleRequest(input, ctx)
  }
  return new Proxy(server as any, {
    // It should have all the attributes of the handler function and the server instance
    has: (_, prop) => {
      return prop in fnHandler || prop in server
    },
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
    apply(_, __, [input, ctx]: Parameters<typeof fnHandler>) {
      return fnHandler(input, ctx)
    },
  })
}
