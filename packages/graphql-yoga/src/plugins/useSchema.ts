import { PromiseOrValue } from '@envelop/core'
import { GraphQLSchema, isSchema } from 'graphql'
import type { GraphQLSchemaWithContext, YogaInitialContext } from '../types'
import type { Plugin } from './types'

export type YogaSchemaDefinition<TContext> =
  | PromiseOrValue<GraphQLSchemaWithContext<TContext>>
  | ((
      context: TContext & { request: Request },
    ) => PromiseOrValue<GraphQLSchemaWithContext<TContext>>)

export const useSchema = <
  TContext extends YogaInitialContext = YogaInitialContext,
>(
  schemaDef?: YogaSchemaDefinition<TContext>,
): Plugin<TContext> => {
  if (schemaDef == null) {
    return {}
  }
  if (isSchema(schemaDef)) {
    return {
      onPluginInit({ setSchema }) {
        setSchema(schemaDef)
      },
    }
  }
  if ('then' in schemaDef) {
    let schema: GraphQLSchema | undefined
    return {
      onRequestParse() {
        return {
          async onRequestParseDone() {
            if (!schema) {
              schema = await schemaDef
            }
          },
        }
      },
      onEnveloped({ setSchema }) {
        if (!schema) {
          throw new Error(
            `You provide a promise of a schema but it hasn't been resolved yet. Make sure you use this plugin with GraphQL Yoga.`,
          )
        }
        setSchema(schema)
      },
    }
  }
  const schemaByRequest = new WeakMap<Request, GraphQLSchema>()
  return {
    onRequestParse({ request, serverContext }) {
      return {
        async onRequestParseDone() {
          const schema = await schemaDef({
            ...serverContext,
            request,
          } as TContext & { request: Request })
          schemaByRequest.set(request, schema)
        },
      }
    },
    onEnveloped({ setSchema, context }) {
      if (context?.request == null) {
        throw new Error(
          'Request object is not available in the context. Make sure you use this plugin with GraphQL Yoga.',
        )
      }
      const schema = schemaByRequest.get(context.request)
      if (schema == null) {
        throw new Error(
          `No schema found for this request. Make sure you use this plugin with GraphQL Yoga.`,
        )
      }
      setSchema(schema)
    },
  }
}
