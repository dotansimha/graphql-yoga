import { ExecutionArgs, ExecutionResult, SubscriptionArgs } from 'graphql';
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
        execute(
          ...args:
            | [ExecutionArgs]
            | [
                schema: ExecutionArgs['schema'],
                document: ExecutionArgs['document'],
                rootValue?: ExecutionArgs['rootValue'],
                contextValue?: ExecutionArgs['contextValue'],
                variableValues?: ExecutionArgs['variableValues'],
                operationName?: ExecutionArgs['operationName'],
                fieldResolver?: ExecutionArgs['fieldResolver'],
                typeResolver?: ExecutionArgs['typeResolver'],
              ]
        ): Promise<ExecutionResult> {
          const executionArgs =
            args.length === 1
              ? args[0]
              : {
                  schema: args[0],
                  document: args[1],
                  rootValue: args[2],
                  contextValue: args[3],
                  variableValues: args[4],
                  operationName: args[5],
                  fieldResolver: args[6],
                  typeResolver: args[7],
                };
          const enveloped = envelopedByContext.get(executionArgs.contextValue);
          if (!enveloped) {
            throw new TypeError('Illegal invocation.');
          }
          return enveloped.execute(executionArgs);
        },
        subscribe(
          ...args:
            | [SubscriptionArgs]
            | [
                schema: SubscriptionArgs['schema'],
                document: SubscriptionArgs['document'],
                rootValue?: SubscriptionArgs['rootValue'],
                contextValue?: SubscriptionArgs['contextValue'],
                variableValues?: SubscriptionArgs['variableValues'],
                operationName?: SubscriptionArgs['operationName'],
                fieldResolver?: SubscriptionArgs['fieldResolver'],
                subscribeFieldResolver?: SubscriptionArgs['subscribeFieldResolver'],
              ]
        ): Promise<AsyncIterableIterator<ExecutionResult>> {
          const subscriptionArgs =
            args.length === 1
              ? args[0]
              : {
                  schema: args[0],
                  document: args[1],
                  rootValue: args[2],
                  contextValue: args[3],
                  variableValues: args[4],
                  operationName: args[5],
                  fieldResolver: args[6],
                  subscribeFieldResolver: args[7],
                };
          const enveloped = envelopedByContext.get(
            subscriptionArgs.contextValue as YogaInitialContext,
          );
          if (!enveloped) {
            throw new TypeError('Illegal invocation.');
          }
          return enveloped.subscribe(subscriptionArgs);
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
