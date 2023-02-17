import { ExecutionResult } from 'graphql'
import {
  Plugin,
  PubSub,
  YogaInitialContext,
  createPubSub,
  isAsyncIterable,
  map,
} from 'graphql-yoga'

export interface GraphQLSSEPluginOptions {
  pubsub: PubSub<{
    'graphql-sse-subscribe': [string, string]
    'graphql-sse-unsubscribe': [string, boolean]
  }>
}

/**
 * Get [GraphQL over Server-Sent Events Protocol](https://github.com/enisdenjo/graphql-sse/blob/master/PROTOCOL.md) integration with GraphQL Yoga by simply installing this plugin!
 *
 * Note that the endpoint defaults to `/graphql/stream`, this is where your [graphql-sse](https://github.com/enisdenjo/graphql-sse) client should connect.
 */
export function useGraphQLSSE(
  options: GraphQLSSEPluginOptions = {
    pubsub: createPubSub(),
  },
): Plugin<YogaInitialContext> {
  const { pubsub } = options
  const tokenByRequest = new WeakMap<Request, string>()
  const operationIdByRequest = new WeakMap<Request, string>()
  return {
    onRequest({ request, url, fetchAPI, endResponse }) {
      const method = request.method.toLowerCase()
      const token =
        request.headers.get('X-GraphQL-Event-Stream-Token') ||
        url.searchParams.get('token')
      const acceptHeader = request.headers.get('Accept')
      if (token != null) {
        tokenByRequest.set(request, token)
        if (acceptHeader?.includes('text/event-stream') && method === 'get') {
          const encoder = new fetchAPI.TextEncoder()
          endResponse(
            new fetchAPI.Response(
              map((str: string) => encoder.encode(str))(
                pubsub.subscribe('graphql-sse-subscribe', token),
              ) as unknown as BodyInit,
              {
                status: 200,
                headers: {
                  'Content-Type': 'text/event-stream',
                },
              },
            ),
          )
        }
      }
      if (method === 'delete') {
        const operationId = url.searchParams.get('operationId')
        if (operationId) {
          pubsub.publish('graphql-sse-unsubscribe', operationId, true)
        }
        endResponse(
          new fetchAPI.Response(null, {
            status: 204,
          }),
        )
      }
      if (method === 'put') {
        const token = fetchAPI.crypto.randomUUID()
        endResponse(
          new fetchAPI.Response(token, {
            status: 201,
            statusText: 'Created',
          }),
        )
      }
    },
    onParams({ request, params }) {
      if (tokenByRequest.has(request) && params?.extensions?.operationId) {
        operationIdByRequest.set(request, params.extensions.operationId)
      }
    },
    onResultProcess({ request, result, fetchAPI, endResponse }) {
      const token = tokenByRequest.get(request)
      if (token) {
        const operationId = operationIdByRequest.get(request)
        // Batching is not supported by GraphQL SSE yet
        if (operationId && !Array.isArray(result)) {
          Promise.resolve().then(async () => {
            if (isAsyncIterable(result)) {
              const asyncIterator = result[Symbol.asyncIterator]()
              pubsub
                .subscribe('graphql-sse-unsubscribe', operationId)
                .next()
                .finally(() => {
                  asyncIterator.return?.()
                })
              let iteratorValue: IteratorResult<ExecutionResult>
              while (!(iteratorValue = await asyncIterator.next()).done) {
                const chunk = iteratorValue.value
                const messageJson = {
                  id: operationId,
                  payload: chunk,
                }
                const messageStr = `event: next\nid: ${operationId}\ndata: ${JSON.stringify(
                  messageJson,
                )}\n\n`
                pubsub.publish('graphql-sse-subscribe', token, messageStr)
              }
            } else {
              const messageJson = {
                id: operationId,
                payload: result,
              }
              const messageStr = `event: next\nid: ${operationId}\ndata: ${JSON.stringify(
                messageJson,
              )}\n\n`
              pubsub.publish('graphql-sse-subscribe', token, messageStr)
            }
            const completeMessageJson = {
              id: operationId,
            }
            const completeMessageStr = `event: complete\ndata: ${JSON.stringify(
              completeMessageJson,
            )}\n\n`
            pubsub.publish('graphql-sse-subscribe', token, completeMessageStr)
          })
          endResponse(
            new fetchAPI.Response(null, {
              status: 202,
            }),
          )
        }
      }
    },
  }
}
