import { PromiseOrValue } from '@envelop/core'
import { GraphQLError, GraphQLSchema, isSchema } from 'graphql'
import { GraphQLSchemaWithContext, YogaInitialContext } from '../types'
import { Plugin } from './types'

export type YogaSchemaDefinition<TContext> =
  | PromiseOrValue<GraphQLSchemaWithContext<TContext>>
  | ((request: Request) => PromiseOrValue<GraphQLSchemaWithContext<TContext>>)

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
      async onParams() {
        if (!schema) {
          schema = await schemaDef
        }
      },
      onEnveloped({ setSchema }) {
        if (!schema) {
          throw new GraphQLError(
            `You provide a promise of a schema but it hasn't been resolved yet. Make sure you use this plugin with GraphQL Yoga.`,
            {
              extensions: {
                http: {
                  status: 500,
                },
              },
            },
          )
        }
        setSchema(schema)
      },
    }
  }
  const schemaByRequest = new WeakMap<Request, GraphQLSchema>()
  return {
    async onParams({ request }) {
      const schema = await schemaDef(request)
      schemaByRequest.set(request, schema)
    },
    onEnveloped({ setSchema, context }) {
      if (context?.request) {
        const schema = schemaByRequest.get(context.request)
        if (schema == null) {
          throw new GraphQLError(
            `No schema found for this request. Make sure you use this plugin with GraphQL Yoga.`,
            {
              extensions: {
                http: {
                  status: 500,
                },
              },
            },
          )
        }
        setSchema(schema)
      } else {
        throw new GraphQLError(
          'Request object is not available in the context. Make sure you use this plugin with GraphQL Yoga.',
          {
            extensions: {
              http: {
                status: 500,
              },
            },
          },
        )
      }
    },
  }
}
