import { ExecutionResult, parse, validate, specifiedRules } from 'graphql'
import { normalizedExecutor } from '@graphql-tools/executor'
import {
  GetEnvelopedFn,
  envelop,
  useEngine,
  useExtendContext,
  PromiseOrValue,
  useMaskedErrors,
} from '@envelop/core'
import { useValidationCache, ValidationCache } from '@envelop/validation-cache'
import { ParserCacheOptions, useParserCache } from '@envelop/parser-cache'
import {
  YogaInitialContext,
  FetchAPI,
  GraphQLParams,
  YogaMaskedErrorOpts,
  MaskError,
} from './types.js'
import {
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
} from './process-request.js'
import { createLogger, LogLevel, YogaLogger } from './logger.js'
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
import { useResultProcessors } from './plugins/useResultProcessor.js'
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
import { yogaDefaultFormatError } from './utils/yoga-default-format-error.js'
import { useSchema, YogaSchemaDefinition } from './plugins/useSchema.js'
import { useLimitBatching } from './plugins/requestValidation/useLimitBatching.js'

/**
 * Configuration options for the server
 */
export type YogaServerOptions<TServerContext, TUserContext> = {
  /**
   * Enable/disable logging or provide a custom logger.
   * @default true
   */
  logging?: boolean | YogaLogger | LogLevel
  /**
   * Prevent leaking unexpected errors to the client. We highly recommend enabling this in production.
   * If you throw `EnvelopError`/`GraphQLError` within your GraphQL resolvers then that error will be sent back to the client.
   *
   * You can lean more about this here:
   * @see https://graphql-yoga.vercel.app/docs/features/error-masking
   *
   * @default true
   */
  maskedErrors?: boolean | Partial<YogaMaskedErrorOpts>
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

  schema?: YogaSchemaDefinition<TUserContext & TServerContext>

  /**
   * Envelop Plugins
   * @see https://envelop.dev/plugins
   */
  plugins?: Array<
    // eslint-disable-next-line @typescript-eslint/ban-types
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
  private onRequestParseHooks: OnRequestParseHook<TServerContext>[]
  private onParamsHooks: OnParamsHook[]
  private onRequestHooks: OnRequestHook<TServerContext>[]
  private onResultProcessHooks: OnResultProcess[]
  private onResponseHooks: OnResponseHook<TServerContext>[]
  private maskedErrorsOpts: YogaMaskedErrorOpts | null
  private id: string

  constructor(options?: YogaServerOptions<TServerContext, TUserContext>) {
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
          ? createLogger()
          : createLogger('silent')
        : typeof logger === 'string'
        ? createLogger(logger)
        : logger

    const maskErrorFn: MaskError =
      (typeof options?.maskedErrors === 'object' &&
        options.maskedErrors.maskError) ||
      yogaDefaultFormatError

    const maskedErrorSet = new WeakSet()

    this.maskedErrorsOpts =
      options?.maskedErrors === false
        ? null
        : {
            errorMessage: 'Unexpected error.',
            ...(typeof options?.maskedErrors === 'object'
              ? options.maskedErrors
              : {}),
            maskError: (error, message) => {
              if (maskedErrorSet.has(error as Error)) {
                return error as Error
              }
              const newError = maskErrorFn(
                error,
                message,
                this.maskedErrorsOpts?.isDev,
              )

              if (newError !== error) {
                this.logger.error(error)
              }

              maskedErrorSet.add(newError)

              return newError
            },
          }

    const maskedErrors =
      this.maskedErrorsOpts != null ? this.maskedErrorsOpts : null

    let batchingLimit = 0
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
      useEngine({
        parse,
        validate,
        execute: normalizedExecutor,
        subscribe: normalizedExecutor,
        specifiedRules,
      }),
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
      options?.context != null &&
        useExtendContext((initialContext) => {
          if (options?.context) {
            if (typeof options.context === 'function') {
              return options.context(initialContext)
            }
            return options.context
          }
          return {}
        }),
      // Middlewares before processing the incoming HTTP request
      useHealthCheck({
        id: this.id,
        logger: this.logger,
        endpoint: options?.healthCheckEndpoint,
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
      useResultProcessors(),
      ...(options?.plugins ?? []),
      // To make sure those are called at the end
      {
        onPluginInit({ addPlugin }) {
          // @ts-expect-error Add plugins has context but this hook doesn't care
          addPlugin(useLimitBatching(batchingLimit))
          // @ts-expect-error Add plugins has context but this hook doesn't care
          addPlugin(useCheckGraphQLQueryParams())
          addPlugin(
            // @ts-expect-error Add plugins has context but this hook doesn't care
            useUnhandledRoute({
              graphqlEndpoint,
              showLandingPage: options?.landingPage ?? true,
            }),
          )
          // We check the method after user-land plugins because the plugin might support more methods (like graphql-sse).
          // @ts-expect-error Add plugins has context but this hook doesn't care
          addPlugin(useCheckMethodForGraphQL())
          // We make sure that the user doesn't send a mutation with GET
          // @ts-expect-error Add plugins has context but this hook doesn't care
          addPlugin(usePreventMutationViaGET())
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
    }) as unknown as GetEnvelopedFn<
      TUserContext & TServerContext & YogaInitialContext
    >

    this.plugins = this.getEnveloped._plugins as Plugin<
      TUserContext & TServerContext & YogaInitialContext,
      TServerContext,
      TUserContext
    >[]

    this.onRequestHooks = []
    this.onRequestParseHooks = []
    this.onParamsHooks = []
    this.onResultProcessHooks = []
    this.onResponseHooks = []
    for (const plugin of this.plugins) {
      if (plugin) {
        if (plugin.onYogaInit) {
          plugin.onYogaInit({
            yoga: this,
          })
        }
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
    // eslint-disable-next-line @typescript-eslint/ban-types
    ...args: {} extends TServerContext
      ? [serverContext?: TServerContext | undefined]
      : [serverContext: TServerContext]
  ) {
    try {
      let result: ExecutionResult | undefined

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
          fetchAPI: this.fetchAPI,
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

        this.logger.debug(`Processing GraphQL Parameters done.`)
      }

      return result
    } catch (error) {
      const errors = handleError(error, this.maskedErrorsOpts, this.logger)

      const result: ExecutionResult = {
        errors,
      }

      return result
    }
  }

  async getResponse(request: Request, serverContext: TServerContext) {
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
        // @ts-expect-error is missing the TUserContext
        getEnveloped: this.getEnveloped,
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
          serverContext,
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
                serverContext,
              ),
            ),
          )
        : this.getResultForParams(
            {
              params: requestParserResult,
              request,
            },
            serverContext,
          ))) as ResultProcessorInput
    } catch (error) {
      const errors = handleError(error, this.maskedErrorsOpts, this.logger)

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

  handle = async (request: Request, serverContext: TServerContext) => {
    try {
      const response = await this.getResponse(request, serverContext)

      for (const onResponseHook of this.onResponseHooks) {
        await onResponseHook({
          request,
          response,
          serverContext,
        })
      }
      return response
    } catch (e: unknown) {
      this.logger.error(e)
      return new this.fetchAPI.Response('Internal Server Error', {
        status: 500,
      })
    }
  }
}

/* eslint-disable */
export type YogaServerInstance<
  TServerContext extends Record<string, any>,
  TUserContext extends Record<string, any>,
> = ServerAdapter<TServerContext, YogaServer<TServerContext, TUserContext>>

export function createYoga<
  TServerContext extends Record<string, any> = {},
  TUserContext extends Record<string, any> = {},
>(
  options: YogaServerOptions<TServerContext, TUserContext>,
): YogaServerInstance<TServerContext, TUserContext> {
  const server = new YogaServer<TServerContext, TUserContext>(options)
  return createServerAdapter(server, server.fetchAPI.Request)
}
