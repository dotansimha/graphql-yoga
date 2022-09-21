import { createYoga, Plugin, createSchema } from 'graphql-yoga'
import { GraphQLError } from 'graphql'

// available when handling requests, needs to be provided by the implementor
type ServerContext = {}

// available in GraphQL, during execution/subscription
interface UserContext {
  disableSubscription: boolean
}

export const yoga = createYoga<ServerContext, UserContext>({
  context: {
    disableSubscription: true,
  },
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        hello: String!
      }
      type Subscription {
        greetings: String!
      }
    `,
    resolvers: {
      Query: {
        hello: () => 'world',
      },
      Subscription: {
        greetings: {
          async *subscribe() {
            yield { greetings: 'Hi' }
          },
        },
      },
    },
  }),
  plugins: [useDisableSubscription()],
})

// context only relevant to the plugin
type DisableSubscriptionPluginContext = {}

function useDisableSubscription(): Plugin<
  DisableSubscriptionPluginContext,
  ServerContext,
  UserContext
> {
  return {
    onSubscribe({ args }) {
      if (args.contextValue.disableSubscription) {
        throw new GraphQLError('Subscriptions have been disabled', {
          extensions: {
            http: {
              status: 400, // report error with a 400
            },
          },
        })
      }
    },
  }
}
