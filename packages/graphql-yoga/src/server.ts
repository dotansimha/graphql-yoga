/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExecutionResult, parse, specifiedRules, validate } from 'graphql';
import {
  envelop,
  GetEnvelopedFn,
  getTraced,
  isAsyncIterable,
  PromiseOrValue,
  useEngine,
  useExtendContext,
  useMaskedErrors,
} from '@envelop/core';
import { normalizedExecutor } from '@graphql-tools/executor';
import { mapAsyncIterator } from '@graphql-tools/utils';
import { createLogger, LogLevel, YogaLogger } from '@graphql-yoga/logger';
import * as defaultFetchAPI from '@whatwg-node/fetch';
import {
  createServerAdapter,
  ServerAdapter,
  ServerAdapterBaseObject,
  ServerAdapterInitialContext,
  ServerAdapterOptions,
  ServerAdapterRequestHandler,
  useCORS,
  useErrorHandling,
} from '@whatwg-node/server';
import { handleError, isAbortError } from './error.js';
import { isGETRequest, parseGETRequest } from './plugins/request-parser/get.js';
import {
  isPOSTFormUrlEncodedRequest,
  parsePOSTFormUrlEncodedRequest,
} from './plugins/request-parser/post-form-url-encoded.js';
import {
  isPOSTGraphQLStringRequest,
  parsePOSTGraphQLStringRequest,
} from './plugins/request-parser/post-graphql-string.js';
import { isPOSTJsonRequest, parsePOSTJsonRequest } from './plugins/request-parser/post-json.js';
import {
  isPOSTMultipartRequest,
  parsePOSTMultipartRequest,
} from './plugins/request-parser/post-multipart.js';
import { useCheckGraphQLQueryParams } from './plugins/request-validation/use-check-graphql-query-params.js';
import { useCheckMethodForGraphQL } from './plugins/request-validation/use-check-method-for-graphql.js';
import { useHTTPValidationError } from './plugins/request-validation/use-http-validation-error.js';
import { useLimitBatching } from './plugins/request-validation/use-limit-batching.js';
import { usePreventMutationViaGET } from './plugins/request-validation/use-prevent-mutation-via-get.js';
import {
  OnExecutionResultHook,
  OnParamsHook,
  OnRequestParseDoneHook,
  OnRequestParseHook,
  OnResultProcess,
  ParamsHandler,
  Plugin,
  RequestParser,
  ResultProcessorInput,
  Tracer,
} from './plugins/types.js';
import { GraphiQLOptions, GraphiQLOptionsOrFactory, useGraphiQL } from './plugins/use-graphiql.js';
import { useHealthCheck } from './plugins/use-health-check.js';
import {
  ParserAndValidationCacheOptions,
  useParserAndValidationCache,
} from './plugins/use-parser-and-validation-cache.js';
import { useRequestParser } from './plugins/use-request-parser.js';
import { useResultProcessors } from './plugins/use-result-processor.js';
import { useSchema, YogaSchemaDefinition } from './plugins/use-schema.js';
import { LandingPageRenderer, useUnhandledRoute } from './plugins/use-unhandled-route.js';
import { processRequest as processGraphQLParams, processResult } from './process-request.js';
import {
  FetchAPI,
  GraphQLParams,
  MaskError,
  YogaInitialContext,
  YogaMaskedErrorOpts,
} from './types.js';
import { maskError } from './utils/mask-error.js';

/**
 * Configuration options for the server
 */
export type YogaServerOptions<TServerContext, TUserContext> = Omit<
  ServerAdapterOptions<TServerContext>,
  'plugins'
> & {
  /**
   * Enable/disable logging or provide a custom logger.
   * @default true
   */
  logging?: boolean | YogaLogger | LogLevel | undefined;
  /**
   * Prevent leaking unexpected errors to the client. We highly recommend enabling this in production.
   * If you throw `EnvelopError`/`GraphQLError` within your GraphQL resolvers then that error will be sent back to the client.
   *
   * You can lean more about this here:
   * @see https://graphql-yoga.vercel.app/docs/features/error-masking
   *
   * @default true
   */
  maskedErrors?: boolean | Partial<YogaMaskedErrorOpts> | undefined;
  /**
   * Context
   */
  context?:
    | ((
        initialContext: YogaInitialContext & TServerContext,
      ) => Promise<TUserContext> | TUserContext)
    | Promise<TUserContext>
    | TUserContext
    | undefined;

  cors?: Parameters<typeof useCORS>[0] | undefined;

  /**
   * GraphQL endpoint
   * So you need to define it explicitly if GraphQL API lives in a different path other than `/graphql`
   *
   * @default "/graphql"
   */
  graphqlEndpoint?: string | undefined;

  /**
   * Readiness check endpoint
   *
   * @default "/health"
   */
  healthCheckEndpoint?: string | undefined;

  /**
   * Whether the landing page should be shown.
   */
  landingPage?: boolean | LandingPageRenderer | undefined;

  /**
   * GraphiQL options
   *
   * @default true
   */
  graphiql?: GraphiQLOptionsOrFactory<TServerContext> | undefined;

  renderGraphiQL?: ((options?: GraphiQLOptions) => PromiseOrValue<BodyInit>) | undefined;

  schema?: YogaSchemaDefinition<TServerContext, TUserContext> | undefined;

  /**
   * Envelop Plugins
   * @see https://envelop.dev/plugins
   */
  plugins?:
    | Array<
        | Plugin<TUserContext & TServerContext & YogaInitialContext>
        | Plugin
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        | {}
      >
    | undefined;

  parserAndValidationCache?: boolean | ParserAndValidationCacheOptions | undefined;
  fetchAPI?: Partial<Record<keyof FetchAPI, any>> | undefined;
  /**
   * GraphQL Multipart Request spec support
   *
   * @see https://github.com/jaydenseric/graphql-multipart-request-spec
   *
   * @default true
   */
  multipart?: boolean | undefined;
  id?: string | undefined;
  /**
   * Batching RFC Support configuration
   *
   * @see https://github.com/graphql/graphql-over-http/blob/main/rfcs/Batching.md
   *
   * @default false
   */
  batching?: BatchingOptions | undefined;

  /**
   * By default, GraphQL Yoga does not allow parameters in the request body except `query`, `variables`, `extensions`, and `operationName`.
   *
   * This option allows you to specify additional parameters that are allowed in the request body.
   *
   * @default []
   *
   * @example ['doc_id', 'id']
   */
  extraParamNames?: string[] | undefined;
};

export type BatchingOptions =
  | boolean
  | {
      /**
       * You can limit the number of batched operations per request.
       *
       * @default 10
       */
      limit?: number;
    };

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
  public readonly getEnveloped: GetEnvelopedFn<TUserContext & TServerContext & YogaInitialContext>;
  public logger: YogaLogger;
  public readonly graphqlEndpoint: string;
  public fetchAPI: FetchAPI;
  protected plugins: Array<
    Plugin<TUserContext & TServerContext & YogaInitialContext, TServerContext, TUserContext>
  >;
  private tracer: Tracer<TUserContext & TServerContext & YogaInitialContext> | undefined;
  private onRequestParseHooks: OnRequestParseHook<TServerContext>[];
  private onParamsHooks: OnParamsHook<TServerContext>[];
  private onExecutionResultHooks: OnExecutionResultHook<TServerContext>[];
  private onResultProcessHooks: OnResultProcess<TServerContext>[];
  private maskedErrorsOpts: YogaMaskedErrorOpts | null;
  private id: string;

  readonly version = '__YOGA_VERSION__';

  constructor(options?: YogaServerOptions<TServerContext, TUserContext>) {
    this.id = options?.id ?? 'yoga';

    this.fetchAPI = {
      ...defaultFetchAPI,
    };
    if (options?.fetchAPI) {
      for (const key in options.fetchAPI) {
        if (options.fetchAPI[key as keyof FetchAPI]) {
          this.fetchAPI[key as keyof FetchAPI] = options.fetchAPI[key as keyof FetchAPI];
        }
      }
    }

    const logger = options?.logging == null ? true : options.logging;
    this.logger =
      typeof logger === 'boolean'
        ? logger === true
          ? createLogger()
          : createLogger('silent')
        : typeof logger === 'string'
          ? createLogger(logger)
          : logger;

    const maskErrorFn: MaskError =
      (typeof options?.maskedErrors === 'object' && options.maskedErrors.maskError) || maskError;

    const maskedErrorSet = new WeakSet();

    this.maskedErrorsOpts =
      options?.maskedErrors === false
        ? null
        : {
            errorMessage: 'Unexpected error.',
            ...(typeof options?.maskedErrors === 'object' ? options.maskedErrors : {}),
            maskError: (error, message) => {
              if (maskedErrorSet.has(error as Error)) {
                return error as Error;
              }
              const newError = maskErrorFn(error, message, this.maskedErrorsOpts?.isDev);

              if (newError !== error) {
                this.logger.error(error);
              }

              maskedErrorSet.add(newError);

              return newError;
            },
          };

    const maskedErrors = this.maskedErrorsOpts == null ? null : this.maskedErrorsOpts;

    let batchingLimit = 0;
    if (options?.batching) {
      if (typeof options.batching === 'boolean') {
        batchingLimit = 10;
      } else {
        batchingLimit = options.batching.limit ?? 10;
      }
    }

    this.graphqlEndpoint = options?.graphqlEndpoint || '/graphql';
    const graphqlEndpoint = this.graphqlEndpoint;

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
        useExtendContext(initialContext => {
          if (options?.context) {
            if (typeof options.context === 'function') {
              return options.context(initialContext);
            }
            return options.context;
          }
          return {};
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
      useErrorHandling(
        (error, request, serverContext: TServerContext & ServerAdapterInitialContext) => {
          const errors = handleError(error, this.maskedErrorsOpts, this.logger);

          const result = {
            errors,
          };

          return processResult({
            request,
            result,
            fetchAPI: this.fetchAPI,
            onResultProcessHooks: this.onResultProcessHooks,
            serverContext,
          });
        },
      ),

      ...(options?.plugins ?? []),
      // To make sure those are called at the end
      {
        onPluginInit({ addPlugin }) {
          if (options?.parserAndValidationCache !== false) {
            addPlugin(
              // @ts-expect-error Add plugins has context but this hook doesn't care
              useParserAndValidationCache(
                !options?.parserAndValidationCache || options?.parserAndValidationCache === true
                  ? {}
                  : options?.parserAndValidationCache,
              ),
            );
          }
          // @ts-expect-error Add plugins has context but this hook doesn't care
          addPlugin(useLimitBatching(batchingLimit));
          // @ts-expect-error Add plugins has context but this hook doesn't care
          addPlugin(useCheckGraphQLQueryParams(options?.extraParamNames));
          const showLandingPage = !!(options?.landingPage ?? true);
          addPlugin(
            // @ts-expect-error Add plugins has context but this hook doesn't care
            useUnhandledRoute({
              graphqlEndpoint,
              showLandingPage,
              landingPageRenderer:
                typeof options?.landingPage === 'function' ? options.landingPage : undefined,
            }),
          );
          // We check the method after user-land plugins because the plugin might support more methods (like graphql-sse).
          // @ts-expect-error Add plugins has context but this hook doesn't care
          addPlugin(useCheckMethodForGraphQL());
          // We make sure that the user doesn't send a mutation with GET
          // @ts-expect-error Add plugins has context but this hook doesn't care
          addPlugin(usePreventMutationViaGET());

          if (maskedErrors) {
            // Make sure we always throw AbortError instead of masking it!
            addPlugin({
              onSubscribe() {
                return {
                  onSubscribeError({ error }) {
                    if (isAbortError(error)) {
                      throw error;
                    }
                  },
                };
              },
            });
            addPlugin(useMaskedErrors(maskedErrors));
          }
          addPlugin(
            // We handle validation errors at the end
            useHTTPValidationError(),
          );
        },
      },
    ];

    this.getEnveloped = envelop({
      plugins: this.plugins,
    }) as unknown as GetEnvelopedFn<TUserContext & TServerContext & YogaInitialContext>;

    this.plugins = this.getEnveloped._plugins as Plugin<
      TUserContext & TServerContext & YogaInitialContext,
      TServerContext,
      TUserContext
    >[];

    this.onRequestParseHooks = [];
    this.onParamsHooks = [];
    this.onExecutionResultHooks = [];
    this.onResultProcessHooks = [];
    for (const plugin of this.plugins) {
      if (plugin) {
        if (plugin.onYogaInit) {
          plugin.onYogaInit({
            yoga: this,
          });
        }
        if (plugin.onRequestParse) {
          this.onRequestParseHooks.push(plugin.onRequestParse);
        }
        if (plugin.onParams) {
          this.onParamsHooks.push(plugin.onParams);
        }
        if (plugin.onExecutionResult) {
          this.onExecutionResultHooks.push(plugin.onExecutionResult);
        }
        if (plugin.onResultProcess) {
          this.onResultProcessHooks.push(plugin.onResultProcess);
        }
      }
    }
  }

  handleParams: ParamsHandler<TServerContext> = async ({ request, context, params }) => {
    let result: ExecutionResult | AsyncIterable<ExecutionResult>;
    try {
      const additionalContext =
        context['request'] === request
          ? {
              params,
            }
          : {
              request,
              params,
            };

      Object.assign(context, additionalContext);

      const enveloped = this.getEnveloped(context);

      this.logger.debug(`Processing GraphQL Parameters`);
      result = await processGraphQLParams({
        params,
        enveloped,
      });
      this.logger.debug(`Processing GraphQL Parameters done.`);
    } catch (error) {
      const errors = handleError(error, this.maskedErrorsOpts, this.logger);

      result = {
        errors,
      };
    }
    if (isAsyncIterable(result)) {
      result = mapAsyncIterator(
        result,
        v => v,
        (error: Error) => {
          if (error.name === 'AbortError') {
            this.logger.debug(`Request aborted`);
            throw error;
          }

          const errors = handleError(error, this.maskedErrorsOpts, this.logger);
          return {
            errors,
          };
        },
      );
    }
    return result;
  };

  getResultForParams = async (
    {
      params,
      request,
    }: {
      params: GraphQLParams;
      request: Request;
    },
    context: TServerContext,
  ) => {
    let result: ExecutionResult | AsyncIterable<ExecutionResult> | undefined;
    let paramsHandler = this.handleParams;

    for (const onParamsHook of this.onParamsHooks) {
      await onParamsHook({
        params,
        request,
        setParams(newParams) {
          params = newParams;
        },
        paramsHandler,
        setParamsHandler(newHandler) {
          paramsHandler = newHandler;
        },
        setResult(newResult) {
          result = newResult;
        },
        fetchAPI: this.fetchAPI,
        context,
      });
    }

    result ??= await paramsHandler({
      request,
      params,
      context: context as TServerContext & YogaInitialContext,
    });

    for (const onExecutionResult of this.onExecutionResultHooks) {
      await onExecutionResult({
        result,
        setResult(newResult) {
          result = newResult;
        },
        request,
        context: context as TServerContext & YogaInitialContext,
      });
    }

    return result;
  };

  parseRequest = async (
    request: Request,
    serverContext: TServerContext & ServerAdapterInitialContext,
  ): Promise<
    | {
        requestParserResult:
          | GraphQLParams<Record<string, any>, Record<string, any>>
          | GraphQLParams<Record<string, any>, Record<string, any>>[];
        response?: never;
      }
    | { requestParserResult?: never; response: Response }
  > => {
    let url = new Proxy({} as URL, {
      get: (_target, prop, _receiver) => {
        url = new this.fetchAPI.URL(request.url, 'http://localhost');
        return Reflect.get(url, prop, url);
      },
    }) as URL;

    let requestParser: RequestParser | undefined;
    const onRequestParseDoneList: OnRequestParseDoneHook[] = [];
    for (const onRequestParse of this.onRequestParseHooks) {
      const onRequestParseResult = await onRequestParse({
        request,
        url,
        requestParser,
        serverContext,
        setRequestParser(parser: RequestParser) {
          requestParser = parser;
        },
      });
      if (onRequestParseResult?.onRequestParseDone != null) {
        onRequestParseDoneList.push(onRequestParseResult.onRequestParseDone);
      }
    }

    this.logger.debug(`Parsing request to extract GraphQL parameters`);

    if (!requestParser) {
      return {
        response: new this.fetchAPI.Response(null, {
          status: 415,
          statusText: 'Unsupported Media Type',
        }),
      };
    }

    let requestParserResult = await requestParser(request);

    for (const onRequestParseDone of onRequestParseDoneList) {
      await onRequestParseDone({
        requestParserResult,
        setRequestParserResult(newParams: GraphQLParams | GraphQLParams[]) {
          requestParserResult = newParams;
        },
      });
    }

    return { requestParserResult };
  };

  handle: ServerAdapterRequestHandler<TServerContext> = async (
    request: Request,
    serverContext: TServerContext & ServerAdapterInitialContext,
  ) => {
    const traced = this.tracer && getTraced({ request });

    const parseRequest = this.tracer?.requestParse
      ? traced!.asyncFn(this.tracer?.requestParse, this.parseRequest)
      : this.parseRequest;
    const { response, requestParserResult } = await parseRequest(request, serverContext);

    if (response) {
      return response;
    }

    const getResultForParams = this.tracer?.operation
      ? (payload: { request: Request; params: GraphQLParams }, context: any) => {
          const traced = getTraced({ request, context });
          const tracedHandler = traced.asyncFn(this.tracer?.operation, this.getResultForParams);
          return tracedHandler(payload, context);
        }
      : this.getResultForParams;

    const result = (await (Array.isArray(requestParserResult)
      ? Promise.all(
          requestParserResult.map(params =>
            getResultForParams(
              {
                params,
                request,
              },
              Object.create(serverContext),
            ),
          ),
        )
      : getResultForParams(
          {
            params: requestParserResult,
            request,
          },
          serverContext,
        ))) as ResultProcessorInput;

    const tracedProcessResult = this.tracer?.resultProcess
      ? traced!.asyncFn(this.tracer.resultProcess, processResult<TServerContext>)
      : processResult<TServerContext>;

    return tracedProcessResult({
      request,
      result,
      fetchAPI: this.fetchAPI,
      onResultProcessHooks: this.onResultProcessHooks,
      serverContext,
    });
  };
}

/* eslint-disable */
export type YogaServerInstance<
  TServerContext extends Record<string, any>,
  TUserContext extends Record<string, any>,
> = ServerAdapter<TServerContext, YogaServer<TServerContext, TUserContext>>;

export function createYoga<
  TServerContext extends Record<string, any> = {},
  TUserContext extends Record<string, any> = {},
>(
  options: YogaServerOptions<TServerContext, TUserContext>,
): YogaServerInstance<TServerContext, TUserContext> {
  const server = new YogaServer<TServerContext, TUserContext>(options);
  return createServerAdapter<TServerContext, YogaServer<TServerContext, TUserContext>>(server, {
    fetchAPI: server.fetchAPI,
    plugins: server['plugins'],
    disposeOnProcessTerminate: options.disposeOnProcessTerminate,
  });
}
