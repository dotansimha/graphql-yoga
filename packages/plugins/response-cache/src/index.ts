import { ExecutionResult } from 'graphql';
import { Maybe, Plugin, PromiseOrValue, YogaInitialContext, YogaLogger } from 'graphql-yoga';
import {
  BuildResponseCacheKeyFunction,
  defaultBuildResponseCacheKey,
  Cache as EnvelopCache,
  createInMemoryCache as envelopCreateInMemoryCache,
  ResponseCacheExtensions as EnvelopResponseCacheExtensions,
  GetDocumentStringFunction,
  InMemoryCacheParameter,
  useResponseCache as useEnvelopResponseCache,
  UseResponseCacheParameter as UseEnvelopResponseCacheParameter,
} from '@envelop/response-cache';

export type UseResponseCacheParameter = Omit<
  UseEnvelopResponseCacheParameter,
  'getDocumentString' | 'session' | 'cache' | 'enabled'
> & {
  cache?: Cache;
  session: (request: Request) => PromiseOrValue<Maybe<string>>;
  enabled?: (request: Request) => boolean;
};

const operationIdByRequest = new WeakMap<Request, string>();

// We trick Envelop plugin by passing operationId as sessionId so we can take it from cache key builder we pass to Envelop
function sessionFactoryForEnvelop({ request }: YogaInitialContext) {
  return operationIdByRequest.get(request);
}

const cacheKeyFactoryForEnvelop: BuildResponseCacheKeyFunction =
  async function cacheKeyFactoryForEnvelop({ sessionId }) {
    if (sessionId == null) {
      throw new Error(
        '[useResponseCache] This plugin is not configured correctly. Make sure you use this plugin with GraphQL Yoga',
      );
    }
    return sessionId;
  };

const getDocumentStringForEnvelop: GetDocumentStringFunction = executionArgs => {
  const context = executionArgs.contextValue as YogaInitialContext;
  if (context.params?.query == null) {
    throw new Error(
      '[useResponseCache] This plugin is not configured correctly. Make sure you use this plugin with GraphQL Yoga',
    );
  }
  return context.params.query as string;
};

export interface ResponseCachePluginExtensions {
  http?: {
    headers?: Record<string, string>;
  };
  responseCache: EnvelopResponseCacheExtensions;
  [key: string]: unknown;
}

interface Cache extends EnvelopCache {
  get(
    key: string,
  ): Promise<ExecutionResult<Record<string, unknown>, ResponseCachePluginExtensions> | undefined>;
}

export function useResponseCache(options: UseResponseCacheParameter): Plugin {
  const buildResponseCacheKey: BuildResponseCacheKeyFunction =
    options?.buildResponseCacheKey || defaultBuildResponseCacheKey;
  const cache = options.cache ?? (createInMemoryCache() as Cache);
  const enabled = options.enabled ?? (() => true);
  let logger: YogaLogger;
  return {
    onYogaInit({ yoga }) {
      logger = yoga.logger;
    },
    onPluginInit({ addPlugin }) {
      addPlugin(
        useEnvelopResponseCache({
          ...options,
          enabled({ request }) {
            return enabled(request);
          },
          cache,
          getDocumentString: getDocumentStringForEnvelop,
          session: sessionFactoryForEnvelop,
          buildResponseCacheKey: cacheKeyFactoryForEnvelop,
          shouldCacheResult({ cacheKey, result }) {
            const shouldCached = options.shouldCacheResult
              ? options.shouldCacheResult({ cacheKey, result })
              : !result.errors?.length;
            if (shouldCached) {
              const extensions = (result.extensions ||= {}) as ResponseCachePluginExtensions;
              const httpExtensions = (extensions.http ||= {});
              const headers = (httpExtensions.headers ||= {});
              headers['ETag'] = cacheKey;
              headers['Last-Modified'] = new Date().toUTCString();
            } else {
              logger.warn('[useResponseCache] Failed to cache due to errors');
            }
            return shouldCached;
          },
        }),
      );
    },
    async onRequest({ request, fetchAPI, endResponse }) {
      if (enabled(request)) {
        const operationId = request.headers.get('If-None-Match');
        if (operationId) {
          const cachedResponse = await cache.get(operationId);
          if (cachedResponse) {
            const lastModifiedFromClient = request.headers.get('If-Modified-Since');
            const lastModifiedFromCache =
              cachedResponse.extensions?.http?.headers?.['Last-Modified'];
            if (
              // This should be in the extensions already but we check it here to make sure
              lastModifiedFromCache != null &&
              // If the client doesn't send If-Modified-Since header, we assume the cache is valid
              (lastModifiedFromClient == null ||
                new Date(lastModifiedFromClient).getTime() >=
                  new Date(lastModifiedFromCache).getTime())
            ) {
              const okResponse = new fetchAPI.Response(null, {
                status: 304,
                headers: {
                  ETag: operationId,
                },
              });
              endResponse(okResponse);
            }
          }
        }
      }
    },
    async onParams({ params, request, setResult }) {
      const operationId = await buildResponseCacheKey({
        documentString: params.query || '',
        variableValues: params.variables,
        operationName: params.operationName,
        sessionId: await options.session(request),
      });
      operationIdByRequest.set(request, operationId);
      if (enabled(request)) {
        const cachedResponse = await cache.get(operationId);
        if (cachedResponse) {
          if (options.includeExtensionMetadata) {
            setResult({
              ...cachedResponse,
              extensions: {
                ...cachedResponse.extensions,
                responseCache: {
                  hit: true,
                },
              },
            });
          } else {
            setResult(cachedResponse);
          }
          return;
        }
      }
    },
  };
}

export { InMemoryCacheParameter } from '@envelop/response-cache';
export function createInMemoryCache(params?: InMemoryCacheParameter): Cache {
  return envelopCreateInMemoryCache(params) as Cache;
}
