import { getOperationAST } from 'graphql'
import { Plugin, YogaInitialContext, FetchAPI } from 'graphql-yoga'
import { createHandler } from 'graphql-sse'
// TODO: not using fetch adapter because we need the FetchAPI too early.
// import { createHandler } from 'graphql-sse/lib/use/fetch'
import { GetEnvelopedFn } from '@envelop/core'

export interface GraphQLSSEPluginOptions {
  /**
   * Endpoint location where GraphQL over SSE will be served.
   *
   * @default '/graphql/stream'
   */
  endpoint?: string
}

export function useGraphQLSSE(
  options: GraphQLSSEPluginOptions = {},
): Plugin<YogaInitialContext> {
  const { endpoint = '/graphql/stream' } = options
  const envelopedForReq = new WeakMap<
    Request,
    { serverContext: any; getEnveloped: GetEnvelopedFn<unknown> }
  >()
  const handler = createHandler<Request, FetchAPI>({
    async onSubscribe(req, params) {
      const { serverContext, getEnveloped } = envelopedForReq.get(req.raw) || {}
      if (!getEnveloped) {
        throw new Error('Enveloped not prepared for request')
      }

      const enveloped = getEnveloped({
        ...serverContext,
        request: req.raw,
        params,
      })

      const document = enveloped.parse(params.query)

      enveloped.validate(enveloped.schema, document)

      const contextValue = await enveloped.contextFactory()

      const executionArgs = {
        schema: enveloped.schema,
        document,
        contextValue,
        variableValues: params.variables,
        operationName: params.operationName,
      }

      const operation = getOperationAST(document, params.operationName)

      const executeFn =
        operation?.operation === 'subscription'
          ? enveloped.subscribe
          : enveloped.execute

      return executeFn(executionArgs)
    },
  })
  return {
    async onRequest({
      request,
      getEnveloped,
      endResponse,
      serverContext,
      fetchAPI,
    }) {
      const [path, _search] = request.url.split('?')
      if (path.endsWith(endpoint)) {
        envelopedForReq.set(request, { serverContext, getEnveloped })

        const [resp, init] = await handler({
          method: request.method,
          url: request.url,
          headers: request.headers,
          body: () => request.text(),
          raw: request,
          context: fetchAPI,
        })

        if (!resp || typeof resp === 'string') {
          return endResponse(new fetchAPI.Response(resp, init))
        }

        let cancelled = false
        const enc = new fetchAPI.TextEncoder()
        const stream = new fetchAPI.ReadableStream({
          async pull(controller) {
            const { done, value } = await resp.next()
            if (value != null) {
              controller.enqueue(enc.encode(value))
            }
            if (done) {
              controller.close()
            }
          },
          async cancel(e) {
            cancelled = true
            await resp.return(e)
          },
        })

        if (request.signal.aborted) {
          // it's possible that the request was aborted before listening
          resp.return(undefined)
        } else {
          // make sure to connect the signals as well
          request.signal.addEventListener('abort', () => {
            if (!cancelled) {
              resp.return()
            }
          })
        }

        endResponse(new fetchAPI.Response(stream, init))
      }
    },
  }
}
