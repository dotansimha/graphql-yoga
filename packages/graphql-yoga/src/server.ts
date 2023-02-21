/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  envelop,
  GetEnvelopedFn,
  PromiseOrValue,
  useEngine,
  useExtendContext,
  useMaskedErrors,
} from '@envelop/core'
import { useValidationCache, ValidationCache } from '@envelop/validation-cache'
import { normalizedExecutor } from '@graphql-tools/executor'
import * as defaultFetchAPI from '@whatwg-node/fetch'
import {
  createServerAdapter,
  ServerAdapter,
  ServerAdapterBaseObject,
  ServerAdapterRequestHandler,
  useCORS,
  useErrorHandling,
} from '@whatwg-node/server'
import { ExecutionResult, parse, specifiedRules, validate } from 'graphql'
import { handleError } from './error.js'
import { createLogger, LogLevel, YogaLogger } from './logger.js'
import { isGETRequest, parseGETRequest } from './plugins/requestParser/GET.js'
import {
  isPOSTFormUrlEncodedRequest,
  parsePOSTFormUrlEncodedRequest,
} from './plugins/requestParser/POSTFormUrlEncoded.js'
import {
  isPOSTGraphQLStringRequest,
  parsePOSTGraphQLStringRequest,
} from './plugins/requestParser/POSTGraphQLString.js'
import {
  isPOSTJsonRequest,
  parsePOSTJsonRequest,
} from './plugins/requestParser/POSTJson.js'
import {
  isPOSTMultipartRequest,
  parsePOSTMultipartRequest,
} from './plugins/requestParser/POSTMultipart.js'
import { useCheckGraphQLQueryParams } from './plugins/requestValidation/useCheckGraphQLQueryParams.js'
import { useCheckMethodForGraphQL } from './plugins/requestValidation/useCheckMethodForGraphQL.js'
import { useHTTPValidationError } from './plugins/requestValidation/useHTTPValidationError.js'
import { useLimitBatching } from './plugins/requestValidation/useLimitBatching.js'
import { usePreventMutationViaGET } from './plugins/requestValidation/usePreventMutationViaGET.js'
import {
  OnParamsHook,
  OnRequestParseDoneHook,
  OnRequestParseHook,
  OnResultProcess,
  Plugin,
  RequestParser,
  ResultProcessorInput,
} from './plugins/types.js'
import {
  GraphiQLOptions,
  GraphiQLOptionsOrFactory,
  useGraphiQL,
} from './plugins/useGraphiQL.js'
import { useHealthCheck } from './plugins/useHealthCheck.js'
import {
  ParserAndValidationCacheOptions,
  useParserAndValidationCache,
} from './plugins/useParserAndValidationCache.js'
import { useRequestParser } from './plugins/useRequestParser.js'
import { useResultProcessors } from './plugins/useResultProcessor.js'
import { useSchema, YogaSchemaDefinition } from './plugins/useSchema.js'
import { useUnhandledRoute } from './plugins/useUnhandledRoute.js'
import {
  processRequest as processGraphQLParams,
  processResult,
} from './process-request.js'
import {
  FetchAPI,
  GraphQLParams,
  MaskError,
  YogaInitialContext,
  YogaMaskedErrorOpts,
} from './types.js'
import { maskError } from './utils/mask-error.js'

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

  cors?: Parameters<typeof useCORS>[0]

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

  parserCache?: boolean | ParserAndValidationCacheOptions
  validationCache?: boolean | ValidationCache
  fetchAPI?: Partial<Record<keyof FetchAPI, any>>
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
> implements ServerAdapterBaseObject<TServerContext>
{
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
  private onResultProcessHooks: OnResultProcess[]
  private maskedErrorsOpts: YogaMaskedErrorOpts | null
  private id: string

  constructor(options?: YogaServerOptions<TServerContext, TUserContext>) {
    this.id = options?.id ?? 'yoga'

    this.fetchAPI = {
      ...defaultFetchAPI,
    }
    if (options?.fetchAPI) {
      for (const key in options.fetchAPI) {
        if (options.fetchAPI[key]) {
          this.fetchAPI[key] = options.fetchAPI[key]
        }
      }
    }

    const logger = options?.logging == null ? true : options.logging
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
      maskError

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
      this.maskedErrorsOpts == null ? null : this.maskedErrorsOpts

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
          graphqlEndpoint,
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
      useErrorHandling((error, request) => {
        const errors = handleError(error, this.maskedErrorsOpts, this.logger)

        const result = {
          errors,
        }

        return processResult({
          request,
          result,
          fetchAPI: this.fetchAPI,
          onResultProcessHooks: this.onResultProcessHooks,
        })
      }),
      ...(options?.plugins ?? []),
      // To make sure those are called at the end
      {
        onPluginInit({ addPlugin }) {
          // Performance things
          if (options?.parserCache !== false) {
            const parserAndValidationCacheOptions: ParserAndValidationCacheOptions =
              {}

            if (typeof options?.parserCache === 'object') {
              parserAndValidationCacheOptions.documentCache =
                options.parserCache.documentCache
              parserAndValidationCacheOptions.errorCache =
                options.parserCache.errorCache
            }

            if (options?.validationCache === false) {
              parserAndValidationCacheOptions.validationCache = false
            } else if (typeof options?.validationCache === 'object') {
              // TODO: Remove this in the next major version
              // Backward compatibility for the old API
              parserAndValidationCacheOptions.validationCache = false
              addPlugin(
                // @ts-expect-error Add plugins has context but this hook doesn't care
                useValidationCache({
                  cache: options.validationCache,
                }),
              )
            }

            addPlugin(
              // @ts-expect-error Add plugins has context but this hook doesn't care
              useParserAndValidationCache(parserAndValidationCacheOptions),
            )
          }
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

    this.onRequestParseHooks = []
    this.onParamsHooks = []
    this.onResultProcessHooks = []
    for (const plugin of this.plugins) {
      if (plugin) {
        if (plugin.onYogaInit) {
          plugin.onYogaInit({
            yoga: this,
          })
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

  handle: ServerAdapterRequestHandler<TServerContext> = async (
    request: Request,
    serverContext: TServerContext,
  ) => {
    let url = new Proxy({} as URL, {
      get: (_target, prop, _receiver) => {
        url = new this.fetchAPI.URL(request.url, 'http://localhost')
        return Reflect.get(url, prop, url)
      },
    }) as URL

    let requestParser: RequestParser | undefined
    const onRequestParseDoneList: OnRequestParseDoneHook[] = []
    for (const onRequestParse of this.onRequestParseHooks) {
      const onRequestParseResult = await onRequestParse({
        request,
        url,
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
      return new this.fetchAPI.Response(null, {
        status: 415,
        statusText: 'Unsupported Media Type',
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

    const result = (await (Array.isArray(requestParserResult)
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

    return processResult({
      request,
      result,
      fetchAPI: this.fetchAPI,
      onResultProcessHooks: this.onResultProcessHooks,
    })
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
>(options: YogaServerOptions<TServerContext, TUserContext>) {
  const server = new YogaServer<TServerContext, TUserContext>(options)
  return createServerAdapter<
    TServerContext,
    YogaServer<TServerContext, TUserContext>
  >(server, {
    fetchAPI: server.fetchAPI,
    plugins: server['plugins'],
  }) as unknown as YogaServerInstance<TServerContext, TUserContext>
  // TODO: Fix in @whatwg-node/server later
}
