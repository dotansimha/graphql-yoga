import { Plugin, YogaInitialContext, YogaServerInstance } from 'graphql-yoga';
import { useSofa as createSofaHandler } from 'sofa-api';
import { SofaHandler } from './types.js';

type SofaHandlerConfig = Parameters<typeof createSofaHandler>[0];

export type SofaPluginConfig = Omit<
  SofaHandlerConfig,
  'schema' | 'context' | 'execute' | 'subscribe'
>;

export function useSofa(config: SofaPluginConfig): Plugin {
  let sofaHandler: SofaHandler;
  let getEnveloped: YogaServerInstance<
    Record<string, unknown>,
    Record<string, unknown>
  >['getEnveloped'];

  const envelopedByContext = new WeakMap<
    YogaInitialContext,
    ReturnType<YogaServerInstance<Record<string, unknown>, Record<string, unknown>>['getEnveloped']>
  >();

  const requestByContext = new WeakMap<YogaInitialContext, Request>();
  return {
    onYogaInit({ yoga }) {
      getEnveloped = yoga.getEnveloped;
    },
    onSchemaChange(onSchemaChangeEventPayload) {
      sofaHandler = createSofaHandler({
        ...config,
        schema: onSchemaChangeEventPayload.schema,
        async context(serverContext: YogaInitialContext) {
          const enveloped = getEnveloped(serverContext);
          const request = requestByContext.get(serverContext);
          const contextValue = await enveloped.contextFactory({ request });
          envelopedByContext.set(contextValue as YogaInitialContext, enveloped);
          return contextValue;
        },
        execute(args) {
          const enveloped = envelopedByContext.get(args.contextValue as YogaInitialContext);
          if (!enveloped) {
            throw new TypeError('Illegal invocation.');
          }
          return enveloped.execute(args);
        },
        subscribe(args) {
          const enveloped = envelopedByContext.get(args.contextValue as YogaInitialContext);
          if (!enveloped) {
            throw new TypeError('Illegal invocation.');
          }
          return enveloped.subscribe(args);
        },
      });
    },
    async onRequest({ request, serverContext, endResponse }) {
      requestByContext.set(serverContext as YogaInitialContext, request);
      const response = await sofaHandler.handle(request, serverContext as Record<string, unknown>);
      if (response != null && response.status !== 404) {
        endResponse(response);
      }
    },
  };
}
