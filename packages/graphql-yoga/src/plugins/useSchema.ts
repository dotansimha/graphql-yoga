import { makeExecutableSchema } from '@graphql-tools/schema'
import { IResolvers, TypeSource } from '@graphql-tools/utils'
import { GraphQLError, GraphQLSchema, isSchema } from 'graphql'
import { Plugin, PromiseOrValue, YogaInitialContext } from 'graphql-yoga'

// TODO: Will be removed later
type TypeDefsAndResolvers<TContext, TRootValue = {}> = {
  typeDefs: TypeSource
  resolvers?:
    | IResolvers<TRootValue, TContext>
    | Array<IResolvers<TRootValue, TContext>>
}

export type YogaSchemaDefinition<TContext, TRootValue> =
  | TypeDefsAndResolvers<TContext, TRootValue>
  | PromiseOrValue<GraphQLSchema>
  | ((request: Request) => PromiseOrValue<GraphQLSchema>)

// Will be moved to a seperate export later
export function getDefaultSchema() {
  return makeExecutableSchema({
    typeDefs: /* GraphQL */ `
      """
      Greetings from GraphQL Yoga!
      """
      type Query {
        greetings: String
      }
      type Subscription {
        """
        Current Time
        """
        time: String
      }
    `,
    resolvers: {
      Query: {
        greetings: () =>
          'This is the `greetings` field of the root `Query` type',
      },
      Subscription: {
        time: {
          async *subscribe() {
            while (true) {
              yield { time: new Date().toISOString() }
              await new Promise((resolve) => setTimeout(resolve, 1000))
            }
          },
        },
      },
    },
  })
}

export const useSchema = <
  TContext extends YogaInitialContext = YogaInitialContext,
  TRootValue = {},
>(
  schemaDef?: YogaSchemaDefinition<TContext, TRootValue>,
): Plugin<TContext> => {
  if (schemaDef == null) {
    const schema = getDefaultSchema()
    return {
      onPluginInit({ setSchema }) {
        setSchema(schema)
      },
    }
  }
  if ('typeDefs' in schemaDef) {
    const schema = makeExecutableSchema(schemaDef)
    return {
      onPluginInit({ setSchema }) {
        setSchema(schema)
      },
    }
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
      async onRequest() {
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
    async onRequest({ request }) {
      const schema = await schemaDef(request)
      schemaByRequest.set(request, schema)
    },
    onEnveloped({ setSchema, context }) {
      if (context?.request) {
        const schema = schemaByRequest.get(context.request)
        if (schema) {
          setSchema(schema)
        }
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
