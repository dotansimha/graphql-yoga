import { getOperationAST } from 'graphql'
import { Plugin, YogaInitialContext } from 'graphql-yoga'
import { createHandler } from 'graphql-sse/lib/use/fetch'

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
  let handler!: (request: Request) => Promise<Response>
  return {
    onYogaInit({ yoga }) {
      handler = createHandler(
        {
          async onSubscribe(req, params) {
            const enveloped = yoga.getEnveloped({
              // TODO: serverContext
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
        },
        yoga.fetchAPI,
      )
    },
    async onRequest({ request, endResponse }) {
      const [path, _search] = request.url.split('?')
      if (path.endsWith(endpoint)) {
        endResponse(await handler(request))
      }
    },
  }
}
