import { GraphQLSchema, isSchema } from 'graphql';
import { PromiseOrValue } from '@envelop/core';
import { isPromise } from '@whatwg-node/server';
import type { GraphQLSchemaWithContext, YogaInitialContext } from '../types.js';
import type { Plugin } from './types.js';

export type YogaSchemaDefinition<TContext> =
  | PromiseOrValue<GraphQLSchemaWithContext<TContext>>
  | ((
      context: TContext & YogaInitialContext,
    ) => PromiseOrValue<GraphQLSchemaWithContext<TContext>>);

export const useSchema = <
  // eslint-disable-next-line @typescript-eslint/ban-types
  TContext = {},
>(
  schemaDef?: YogaSchemaDefinition<TContext>,
): Plugin<YogaInitialContext & TContext> => {
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
          onRequestParseDone() {
            return schemaDef.then(s => {
              schema = s;
            });
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
        onRequestParseDone(): PromiseOrValue<void> {
          const schema$ = schemaDef({
            ...serverContext,
            request,
          } as TContext & YogaInitialContext);
          if (isPromise(schema$)) {
            return schema$.then(schema => {
              schemaByRequest.set(request, schema);
            });
          }
          schemaByRequest.set(request, schema$);
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
