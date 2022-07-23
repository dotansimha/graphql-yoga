import {
  IExecutableSchemaDefinition,
  makeExecutableSchema,
} from '@graphql-tools/schema'
import { GraphQLSchemaWithContext, YogaInitialContext } from '../types.js'

export function createSchema<TContext = YogaInitialContext>(
  opts: IExecutableSchemaDefinition<TContext>,
): GraphQLSchemaWithContext<TContext> {
  return makeExecutableSchema<TContext>(opts)
}

export function getDefaultSchema<
  TContext,
>(): GraphQLSchemaWithContext<TContext> {
  return createSchema<TContext>({
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
