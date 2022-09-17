import { useSofa as createSofaHandler } from 'sofa-api'
import { Plugin, YogaInitialContext, YogaServerInstance } from 'graphql-yoga'

type SofaHandler = ReturnType<typeof createSofaHandler>
type SofaHandlerConfig = Parameters<typeof createSofaHandler>[0]

export type SofaPluginConfig = Omit<
  SofaHandlerConfig,
  'schema' | 'context' | 'execute' | 'subscribe'
>

export function useSofa(config: SofaPluginConfig): Plugin {
  let sofaHandler: SofaHandler
  const envelopedByRequest = new WeakMap<
    any,
    ReturnType<YogaServerInstance<any, any, any>['getEnveloped']>
  >()
  let getEnveloped: YogaServerInstance<any, any, any>['getEnveloped']
  return {
    onYogaInit({ yoga }) {
      getEnveloped = yoga.getEnveloped
    },
    onSchemaChange(onSchemaChangeEventPayload) {
      sofaHandler = createSofaHandler({
        schema: onSchemaChangeEventPayload.schema,
        async context(serverContext: YogaInitialContext) {
          const enveloped = getEnveloped(serverContext)
          const contextValue = await enveloped.contextFactory()
          envelopedByRequest.set(serverContext.request, enveloped)
          return contextValue
        },
        execute(args) {
          const contextValue = args.contextValue as YogaInitialContext
          const enveloped = envelopedByRequest.get(contextValue.request)
          if (!enveloped) {
            throw new TypeError('Illegal invocation.')
          }
          return enveloped.execute(args)
        },
        subscribe(args) {
          const contextValue = args.contextValue as YogaInitialContext
          const enveloped = envelopedByRequest.get(contextValue.request)
          if (!enveloped) {
            throw new TypeError('Illegal invocation.')
          }
          return enveloped.subscribe(args)
        },
        ...config,
      })
    },
    async onRequest({ request, serverContext, endResponse }) {
      const response = await sofaHandler.handle(request, serverContext)
      if (response) {
        endResponse(response)
      }
    },
  }
}
