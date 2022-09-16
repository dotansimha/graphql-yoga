import { print, ExecutionResult } from 'graphql'
import {
  GetEnvelopedFn,
  envelop,
  useMaskedErrors,
  UseMaskedErrorsOpts,
  useExtendContext,
  useLogger,
  PromiseOrValue,
} from '@envelop/core'
import { useValidationCache, ValidationCache } from '@envelop/validation-cache'
import { ParserCacheOptions, useParserCache } from '@envelop/parser-cache'
import {
  GraphQLServerInject,
  YogaInitialContext,
  FetchAPI,
  GraphQLParams,
  YogaMaskedErrorOpts,
} from './types.js'
import {
  ExecutorResult,
  OnParamsHook,
  OnRequestHook,
  OnRequestParseDoneHook,
  OnRequestParseHook,
  OnResponseHook,
  OnResultProcess,
  Plugin,
  RequestParser,
  ResultProcessorInput,
} from './plugins/types.js'
import { createFetch } from '@whatwg-node/fetch'
import { ServerAdapter, createServerAdapter } from '@whatwg-node/server'
import {
  processRequest as processGraphQLParams,
  processResult,
} from './processRequest.js'
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
import { processRegularResult } from './plugins/resultProcessor/regular.js'
import { processPushResult } from './plugins/resultProcessor/push.js'
import { processMultipartResult } from './plugins/resultProcessor/multipart.js'
import {
  isPOSTFormUrlEncodedRequest,
  parsePOSTFormUrlEncodedRequest,
} from './plugins/requestParser/POSTFormUrlEncoded.js'
import { handleError } from './error.js'
import { useCheckMethodForGraphQL } from './plugins/requestValidation/useCheckMethodForGraphQL.js'
import { useCheckGraphQLQueryParams } from './plugins/requestValidation/useCheckGraphQLQueryParams.js'
import { useHTTPValidationError } from './plugins/requestValidation/useHTTPValidationError.js'
import { usePreventMutationViaGET } from './plugins/requestValidation/usePreventMutationViaGET.js'
import { useUnhandledRoute } from './plugins/useUnhandledRoute.js'
import { yogaDefaultFormatError } from './utils/yogaDefaultFormatError.js'
import { useSchema, YogaSchemaDefinition } from './plugins/useSchema.js'
import { useLimitBatching } from './plugins/requestValidation/useLimitBatching.js'

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
   * @default true
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
   * So you need to define it explicitly if GraphQL API lives in a different path other than `/graphql`
   *
   * @default "/graphql"
   */
  graphqlEndpoint?: string

  /**
   * Readiness check endpoint
   *
   * @default "/readiness"
   */
  readinessCheckEndpoint?: string

  /**
   * Readiness check endpoint
   *
   * @default "/health"
   */
  healthCheckEndpoint?: string

  /**
   * Whether the landing page should be shown.
   */
  landingPage?: boolean

  /**
   * GraphiQL options
   *
   * @default true
   */
  graphiql?: GraphiQLOptionsOrFactory<TServerContext>

  renderGraphiQL?: (options?: GraphiQLOptions) => PromiseOrValue<BodyInit>

  schema?: YogaSchemaDefinition<
    TUserContext & TServerContext & YogaInitialContext,
    TRootValue
  >

  /**
   * Envelop Plugins
   * @see https://envelop.dev/plugins
   */
  plugins?: Array<
    Plugin<TUserContext & TServerContext & YogaInitialContext> | Plugin | {}
  >

  parserCache?: boolean | ParserCacheOptions
  validationCache?: boolean | ValidationCache
  fetchAPI?: FetchAPI
  /**
   * GraphQL Multipart Request spec support
   *
   * @see https://github.com/jaydenseric/graphql-multipart-request-spec
   *
   * @default true
   */
  multipart?: boolean
  id?: string
  /**
   * Batching RFC Support configuration
   *
   * @see https://github.com/graphql/graphql-over-http/blob/main/rfcs/Batching.md
   *
   * @default false
   */
  batching?: BatchingOptions
}

export type BatchingOptions =
  | boolean
  | {
      /**
       * You can limit the number of batched operations per request.
       *
       * @default 10
       */
      limit?: number
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
  public readonly graphqlEndpoint: string
  public fetchAPI: FetchAPI
  protected plugins: Array<
    Plugin<TUserContext & TServerContext & YogaInitialContext, TServerContext>
  >
  private onRequestParseHooks: OnRequestParseHook[]
  private onParamsHooks: OnParamsHook[]
  private onRequestHooks: OnRequestHook<TServerContext>[]
  private onResultProcessHooks: OnResultProcess[]
  private onResponseHooks: OnResponseHook<TServerContext>[]
  private maskedErrorsOpts: YogaMaskedErrorOpts | null
  private id: string

  constructor(
    options?: YogaServerOptions<TServerContext, TUserContext, TRootValue>,
  ) {
    this.id = options?.id ?? 'yoga'
    this.fetchAPI =
      options?.fetchAPI ??
      createFetch({
        formDataLimits: {
          fieldsFirst: true,
        },
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

    const maskedErrors =
      this.maskedErrorsOpts != null ? this.maskedErrorsOpts : null

    let batchingLimit: number = 0
    if (options?.batching) {
      if (typeof options.batching === 'boolean') {
        batchingLimit = 10
      } else {
        batchingLimit = options.batching.limit ?? 10
      }
    }

    this.graphqlEndpoint = options?.graphqlEndpoint || '/graphql'
    const graphqlEndpoint = this.graphqlEndpoint

    this.plugins = [
      // Use the schema provided by the user
      !!options?.schema && useSchema(options.schema),

      // Performance things
      options?.parserCache !== false &&
        useParserCache(
          typeof options?.parserCache === 'object'
            ? options.parserCache
            : undefined,
        ),
      options?.validationCache !== false &&
        useValidationCache({
          cache:
            typeof options?.validationCache === 'object'
              ? options.validationCache
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
                  params: { query, operationName, variables, extensions },
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
      options?.multipart !== false &&
        useRequestParser({
          match: isPOSTMultipartRequest,
          parse: parsePOSTMultipartRequest,
        }),

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
        mediaTypes: ['multipart/mixed'],
        processResult: processMultipartResult,
      }),
      useResultProcessor({
        mediaTypes: ['text/event-stream'],
        processResult: processPushResult,
      }),
      useResultProcessor({
        mediaTypes: ['application/graphql-response+json', 'application/json'],
        processResult: processRegularResult,
      }),
      ...(options?.plugins ?? []),
      useLimitBatching(batchingLimit),
      useCheckGraphQLQueryParams(),
      useUnhandledRoute({
        graphqlEndpoint,
        showLandingPage: options?.landingPage ?? true,
      }),
      // We make sure that the user doesn't send a mutation with GET
      usePreventMutationViaGET(),
      // To make sure those are called at the end
      {
        onPluginInit({ addPlugin }) {
          if (maskedErrors) {
            addPlugin(useMaskedErrors(maskedErrors))
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
    this.onParamsHooks = []
    this.onResultProcessHooks = []
    this.onResponseHooks = []
    for (const plugin of this.plugins) {
      if (plugin) {
        if (plugin.onRequest) {
          this.onRequestHooks.push(plugin.onRequest)
        }
        if (plugin.onRequestParse) {
          this.onRequestParseHooks.push(plugin.onRequestParse)
        }
        if (plugin.onParams) {
          this.onParamsHooks.push(plugin.onParams)
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

  async getResultForParams(
    {
      params,
      request,
    }: {
      params: GraphQLParams
      request: Request
    },
    ...args: {} extends TServerContext
      ? [serverContext?: TServerContext | undefined]
      : [serverContext: TServerContext]
  ) {
    try {
      let result: ExecutorResult | undefined

      for (const onParamsHook of this.onParamsHooks) {
        await onParamsHook({
          params,
          request,
          setParams(newParams) {
            params = newParams
          },
          setResult(newResult) {
            result = newResult
          },
        })
      }

      if (result == null) {
        const serverContext = args[0]
        const initialContext = {
          ...serverContext,
          request,
          params,
        }

        const enveloped = this.getEnveloped(initialContext)

        this.logger.debug(`Processing GraphQL Parameters`)

        result = await processGraphQLParams({
          params,
          enveloped,
        })
      }

      return result
    } catch (error) {
      const errors = handleError(error, this.maskedErrorsOpts)

      const result: ExecutionResult = {
        errors,
      }

      return result
    }
  }

  async getResponse(
    request: Request,
    ...args: {} extends TServerContext
      ? [serverContext?: TServerContext | undefined]
      : [serverContext: TServerContext]
  ) {
    const serverContext = args[0]
    const url = new URL(request.url, 'http://localhost')
    for (const onRequestHook of this.onRequestHooks) {
      let response: Response | undefined
      await onRequestHook({
        request,
        serverContext,
        fetchAPI: this.fetchAPI,
        url,
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
    let result: ResultProcessorInput

    try {
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

      let requestParserResult = await requestParser(request)

      for (const onRequestParseDone of onRequestParseDoneList) {
        await onRequestParseDone({
          requestParserResult,
          setRequestParserResult(newParams: GraphQLParams | GraphQLParams[]) {
            requestParserResult = newParams
          },
        })
      }

      result = (await (Array.isArray(requestParserResult)
        ? Promise.all(
            requestParserResult.map((params) =>
              this.getResultForParams(
                {
                  params,
                  request,
                },
                ...args,
              ),
            ),
          )
        : this.getResultForParams(
            {
              params: requestParserResult,
              request,
            },
            ...args,
          ))) as ResultProcessorInput
    } catch (error) {
      const errors = handleError(error, this.maskedErrorsOpts)

      result = {
        errors,
      }
    }

    const response = await processResult({
      request,
      result,
      fetchAPI: this.fetchAPI,
      onResultProcessHooks: this.onResultProcessHooks,
    })

    return response
  }

  handleRequest = async (
    request: Request,
    ...args: {} extends TServerContext
      ? [serverContext?: TServerContext | undefined]
      : [serverContext: TServerContext]
  ) => {
    try {
      const response = await this.getResponse(request, ...args)

      for (const onResponseHook of this.onResponseHooks) {
        await onResponseHook({
          request,
          response,
          serverContext: args[0],
        })
      }
      return response
    } catch (e: any) {
      this.logger.error(e)
      return new this.fetchAPI.Response('Internal Server Error', {
        status: 500,
      })
    }
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

export type YogaServerInstance<
  TServerContext extends Record<string, any>,
  TUserContext extends Record<string, any>,
  TRootValue extends Record<string, any>,
> = ServerAdapter<
  TServerContext,
  YogaServer<TServerContext, TUserContext, TRootValue>
>

export function createYoga<
  TServerContext extends Record<string, any> = {},
  TUserContext extends Record<string, any> = {},
  TRootValue extends Record<string, any> = {},
>(
  options: YogaServerOptions<TServerContext, TUserContext, TRootValue>,
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
