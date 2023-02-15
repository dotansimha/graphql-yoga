import {
  BuildResponseCacheKeyFunction,
  createInMemoryCache,
  defaultBuildResponseCacheKey,
  GetDocumentStringFunction,
  useResponseCache as useEnvelopResponseCache,
  UseResponseCacheParameter as UseEnvelopResponseCacheParameter,
} from '@envelop/response-cache'
import { ExecutionResult } from 'graphql'
import {
  Maybe,
  Plugin,
  PromiseOrValue,
  YogaInitialContext,
  YogaLogger,
} from 'graphql-yoga'

export type UseResponseCacheParameter = Omit<
  UseEnvelopResponseCacheParameter,
  'getDocumentString' | 'session'
> & {
  session: (request: Request) => PromiseOrValue<Maybe<string>>
  enabled?: (request: Request) => boolean
}

const operationIdByRequest = new WeakMap<Request, string>()

// We trick Envelop plugin by passing operationId as sessionId so we can take it from cache key builder we pass to Envelop
function sessionFactoryForEnvelop({ request }: YogaInitialContext) {
  return operationIdByRequest.get(request)
}

const cacheKeyFactoryForEnvelop: BuildResponseCacheKeyFunction =
  async function cacheKeyFactoryForEnvelop({ sessionId }) {
    if (sessionId == null) {
      throw new Error(
        '[useResponseCache] This plugin is not configured correctly. Make sure you use this plugin with GraphQL Yoga',
      )
    }
    return sessionId
  }

const getDocumentStringForEnvelop: GetDocumentStringFunction = (
  executionArgs,
) => {
  const context = executionArgs.contextValue as YogaInitialContext
  if (context.params?.query == null) {
    throw new Error(
      '[useResponseCache] This plugin is not configured correctly. Make sure you use this plugin with GraphQL Yoga',
    )
  }
  return context.params.query as string
}

export function useResponseCache(options: UseResponseCacheParameter): Plugin {
  const buildResponseCacheKey: BuildResponseCacheKeyFunction =
    options?.buildResponseCacheKey || defaultBuildResponseCacheKey
  const cache = options.cache ?? createInMemoryCache()
  const enabled = options.enabled ?? (() => true)
  const cachedLastModifiedByRequest = new WeakMap<Request, string>()
  let logger: YogaLogger
  return {
    onYogaInit({ yoga }) {
      logger = yoga.logger
    },
    onPluginInit({ addPlugin }) {
      addPlugin(
        useEnvelopResponseCache({
          ...options,
          cache,
          getDocumentString: getDocumentStringForEnvelop,
          session: sessionFactoryForEnvelop,
          buildResponseCacheKey: cacheKeyFactoryForEnvelop,
          shouldCacheResult({ result }) {
            const shouldCached = options.shouldCacheResult
              ? options.shouldCacheResult({ result })
              : !result.errors?.length
            if (shouldCached) {
              result.extensions ||= {}
              result.extensions.responseCache ||= {}
              result.extensions.responseCache!['lastModified'] =
                new Date().toString()
            } else {
              logger.warn('[useResponseCache] Failed to cache due to errors')
            }
            return shouldCached
          },
          includeExtensionMetadata: true,
        }),
      )
    },
    async onRequest({ request, fetchAPI, endResponse }) {
      if (enabled(request)) {
        const operationId = request.headers.get('If-None-Match')
        if (operationId) {
          const cachedResponse = await cache.get(operationId)
          if (cachedResponse) {
            const lastModifiedFromClient =
              request.headers.get('If-Modified-Since')
            const lastModifiedFromCache =
              cachedResponse.extensions?.responseCache?.['lastModified']
            if (
              new Date(lastModifiedFromClient!).getTime() >=
              new Date(lastModifiedFromCache).getTime()
            ) {
              const okResponse = new fetchAPI.Response(null, {
                status: 304,
                headers: {
                  ETag: operationId,
                },
              })
              endResponse(okResponse)
            }
          }
        }
      }
    },
    async onParams({ params, request, setResult }) {
      if (enabled(request)) {
        const operationId = await buildResponseCacheKey({
          documentString: params.query || '',
          variableValues: params.variables,
          operationName: params.operationName,
          sessionId: await options.session(request),
        })
        operationIdByRequest.set(request, operationId)
        const cachedResponse = await cache.get(operationId)
        if (cachedResponse) {
          cachedResponse.extensions ||= {}
          cachedResponse.extensions.responseCache ||= {}
          ;(cachedResponse.extensions.responseCache as { hit: boolean }).hit =
            true
          setResult(cachedResponse)
          return
        }
      }
    },
    onResultProcess({ request, result }) {
      const executionResult = result as ExecutionResult
      if (executionResult.extensions?.responseCache != null) {
        cachedLastModifiedByRequest.set(
          request,
          executionResult.extensions.responseCache['lastModified'],
        )
        if (!options.includeExtensionMetadata) {
          executionResult.extensions.responseCache = undefined
        }
      }
    },
    onResponse({ response, request }) {
      const lastModified = cachedLastModifiedByRequest.get(request)
      if (lastModified) {
        const operationId = operationIdByRequest.get(request)
        if (operationId) {
          response.headers.set('ETag', operationId)
          response.headers.set('Last-Modified', lastModified)
        }
      }
    },
  }
}

export { createInMemoryCache }
