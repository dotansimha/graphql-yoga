import { getOperationAST } from 'graphql'
import { Plugin, YogaInitialContext } from 'graphql-yoga'
import { createHandler } from 'graphql-sse/lib/use/fetch'
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
  const handler = createHandler({
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
    async onRequest({ request, getEnveloped, endResponse, serverContext }) {
      const [path, _search] = request.url.split('?')
      if (path.endsWith(endpoint)) {
        envelopedForReq.set(request, { serverContext, getEnveloped })
        endResponse(await handler(request))
      }
    },
  }
}
