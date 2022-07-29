import { createYoga } from 'graphql-yoga'
import { createSchema } from 'graphql-yoga/schema'
import { Repeater } from 'graphql-yoga/subscription'

// We can define GraphQL Route dynamically using env vars.
declare var GRAPHQL_ROUTE: string

const yoga = createYoga({
  graphqlEndpoint: GRAPHQL_ROUTE || '/graphql',
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        greetings: String
        time: String
      }
    `,
    resolvers: {
      Query: {
        greetings: () =>
          'This is the `greetings` field of the root `Query` type',
      },
      Subscription: () =>
        new Repeater(async (push, end) => {
          const getTime = () => new Date().toISOString()
          push(getTime())
          const interval = setInterval(() => push(getTime()), 1000)
          end.then(() => clearInterval(interval))
          await end
        }),
    },
  }),
})

self.addEventListener('fetch', yoga)
