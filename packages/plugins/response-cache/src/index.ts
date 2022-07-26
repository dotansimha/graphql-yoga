import {
  BuildResponseCacheKeyFunction,
  createInMemoryCache,
  defaultBuildResponseCacheKey,
  GetDocumentStringFromContextFunction,
  useResponseCache as useEnvelopResponseCache,
  UseResponseCacheParameter as UseEnvelopResponseCacheParameter,
} from '@envelop/response-cache'
import { GraphQLParams, Maybe, Plugin, YogaInitialContext } from 'graphql-yoga'

export type UseResponseCacheParameter = Omit<
  UseEnvelopResponseCacheParameter,
  'getDocumentStringFromContext' | 'session'
> & {
  session: (params: GraphQLParams, request: Request) => Maybe<string>
  enabled?: (params: GraphQLParams, request: Request) => boolean
}

// Probably this is not used but somehow if Envelop plugin needs that
const getDocumentStringFromContext: GetDocumentStringFromContextFunction = (
  context,
) => context.query as string

const operationIdByRequest = new WeakMap<Request, string>()

// We trick Envelop plugin by passing operationId as sessionId so we can take it from cache key builder we pass to Envelop
function sessionFactoryForEnvelop({ request }: YogaInitialContext) {
  return operationIdByRequest.get(request)
}
const buildResponseCacheKeyForEnvelop: BuildResponseCacheKeyFunction = async ({
  sessionId,
}) => sessionId!

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
          getDocumentStringFromContext,
          session: sessionFactoryForEnvelop,
          buildResponseCacheKey: buildResponseCacheKeyForEnvelop,
        }),
      )
    },
    onRequestParse({ request }) {
      return {
        async onRequestParseDone({ params, setResult }) {
          if (enabled(params, request)) {
            const operationId = await buildResponseCacheKey({
              documentString: params.query!,
              variableValues: params.variables,
              operationName: params.operationName,
              sessionId: options.session(params, request),
            })
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
            operationIdByRequest.set(request, operationId)
          }
        },
      }
    },
  }
}
