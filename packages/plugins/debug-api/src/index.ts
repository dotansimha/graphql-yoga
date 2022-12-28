import { ExecutionResult } from 'graphql'
import { createYoga, Plugin } from 'graphql-yoga'
import { APP_HTML } from './app.js'
import {
  Context,
  ExecutedOperation,
  ExecutedOperationsStore,
  schema,
} from './schema.js'

const GQL_ENDPOINT = '/__debug/graphql'

export function useDebugApi(config: { endpoint?: string }): Plugin {
  const appEndpoint = config.endpoint || '/debug'
  const operationsStore: ExecutedOperationsStore = []

  const internalHandler = createYoga<Context>({
    graphqlEndpoint: GQL_ENDPOINT,
    graphiql: false,
    schema,
    context: { operationsStore },
  })

  const reqResMatching = new WeakMap<Request, ExecutedOperation>()

  return {
    onExecute({ args }) {
      const record: ExecutedOperation = {
        id:
          args.contextValue.request.headers.get('x-request-id') ||
          operationsStore.length.toString(),
        document: args.document,
        variables: args.variableValues || {},
        startTime: new Date(),
        request: new Request(args.contextValue.request.url, {
          headers: args.contextValue.request.headers,
          method: args.contextValue.request.method,
        }),
      }

      operationsStore.push(record)
      reqResMatching.set(args.contextValue.request, record)

      return {
        onExecuteDone({ result }) {
          record.result = result as ExecutionResult
          record.endTime = new Date()
        },
      }
    },
    onResponse({ response, request }) {
      const record = reqResMatching.get(request)

      if (record) {
        record.response = response.clone()
      }
    },
    async onRequest({ url, request, endResponse }) {
      if (url.pathname === GQL_ENDPOINT) {
        const handled = await internalHandler(request)
        endResponse(handled)
      }

      if (url.pathname === appEndpoint) {
        const response = new Response(APP_HTML, {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
          },
        })
        endResponse(response)
      }
    },
  }
}
