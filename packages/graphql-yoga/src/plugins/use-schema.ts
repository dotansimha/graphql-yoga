import { GraphQLSchema, isSchema } from 'graphql';
import { PromiseOrValue } from '@envelop/core';
import type { GraphQLSchemaWithContext, YogaInitialContext } from '../types.js';
import type { Plugin } from './types.js';

export type YogaSchemaDefinition<TServerContext, TUserContext> =
  | PromiseOrValue<GraphQLSchemaWithContext<TServerContext & YogaInitialContext & TUserContext>>
  | ((
      context: TServerContext & { request: YogaInitialContext['request'] },
    ) => PromiseOrValue<
      GraphQLSchemaWithContext<TServerContext & YogaInitialContext & TUserContext>
    >);

export const useSchema = <
  // eslint-disable-next-line @typescript-eslint/ban-types
  TServerContext = {},
  // eslint-disable-next-line @typescript-eslint/ban-types
  TUserContext = {},
>(
  schemaDef?: YogaSchemaDefinition<TServerContext, TUserContext>,
): Plugin<YogaInitialContext & TServerContext> => {
  if (schemaDef == null) {
    return {};
  }
  if (isSchema(schemaDef)) {
    return {
      onPluginInit({ setSchema }) {
        setSchema(schemaDef);
      },
    };
  }
  if ('then' in schemaDef) {
    let schema: GraphQLSchema | undefined;
    return {
      onRequestParse() {
        return {
          async onRequestParseDone() {
            schema ||= await schemaDef;
          },
        };
      },
      onEnveloped({ setSchema }) {
        if (!schema) {
          throw new Error(
            `You provide a promise of a schema but it hasn't been resolved yet. Make sure you use this plugin with GraphQL Yoga.`,
          );
        }
        setSchema(schema);
      },
    };
  }
  const schemaByRequest = new WeakMap<Request, GraphQLSchema>();
  return {
    onRequestParse({ request, serverContext }) {
      return {
        async onRequestParseDone() {
          const schema = await schemaDef({
            ...(serverContext as TServerContext),
            request,
          });
          schemaByRequest.set(request, schema);
        },
      };
    },
    onEnveloped({ setSchema, context }) {
      if (context?.request == null) {
        throw new Error(
          'Request object is not available in the context. Make sure you use this plugin with GraphQL Yoga.',
        );
      }
      const schema = schemaByRequest.get(context.request);
      if (schema == null) {
        throw new Error(
          `No schema found for this request. Make sure you use this plugin with GraphQL Yoga.`,
        );
      }
      setSchema(schema);
    },
  };
};
