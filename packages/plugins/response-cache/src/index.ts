import {
  BuildResponseCacheKeyFunction,
  createInMemoryCache,
  defaultBuildResponseCacheKey,
  useResponseCache as useEnvelopResponseCache,
  UseResponseCacheParameter as UseEnvelopResponseCacheParameter,
} from '@envelop/response-cache'
import { Maybe, Plugin, PromiseOrValue, YogaInitialContext } from 'graphql-yoga'

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
    return sessionId!
  }

export function useResponseCache(options: UseResponseCacheParameter): Plugin {
  const buildResponseCacheKey: BuildResponseCacheKeyFunction =
    options?.buildResponseCacheKey || defaultBuildResponseCacheKey
  const cache = options.cache ?? createInMemoryCache()
  const enabled = options.enabled ?? (() => true)
  return {
    onPluginInit({ addPlugin }) {
      addPlugin(
        useEnvelopResponseCache({
          ...options,
          cache,
          session: sessionFactoryForEnvelop,
          buildResponseCacheKey: cacheKeyFactoryForEnvelop,
        }),
      )
    },
    async onRequest({ request, fetchAPI, endResponse }) {
      if (enabled(request)) {
        const operationId = request.headers.get('If-None-Match')
        if (operationId) {
          const cachedResponse = await cache.get(operationId)
          if (cachedResponse) {
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
    },
    async onParams({ params, request, setResult }) {
      if (enabled(request)) {
        const operationId = await buildResponseCacheKey({
          documentString: params.query!,
          variableValues: params.variables,
          operationName: params.operationName,
          sessionId: await options.session(request),
        })
        operationIdByRequest.set(request, operationId)
        const cachedResponse = await cache.get(operationId)
        if (cachedResponse) {
          if (options.includeExtensionMetadata) {
            setResult({
              ...cachedResponse,
              extensions: {
                responseCache: {
                  hit: true,
                },
              },
            })
          } else {
            setResult(cachedResponse)
          }
          return
        }
      }
    },
    onResponse({ response, request }) {
      if (enabled(request)) {
        const operationId = operationIdByRequest.get(request)
        if (operationId) {
          response.headers.set('ETag', operationId)
        }
      }
    },
  }
}

export { createInMemoryCache }
