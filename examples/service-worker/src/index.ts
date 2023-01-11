import { createSchema, createYoga, Repeater } from 'graphql-yoga'

// We can define GraphQL Route dynamically using env vars.
declare let GRAPHQL_ROUTE: string

const yoga = createYoga({
  graphqlEndpoint: GRAPHQL_ROUTE || '/graphql',
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        greetings: String
      }
      type Subscription {
        time: String
      }
    `,
    resolvers: {
      Query: {
        greetings: () => 'This is the `greetings` field of the root `Query` type',
      },
      Subscription: {
        time: {
          subscribe: () =>
            new Repeater((push, end) => {
              const interval = setInterval(() => push(new Date().toISOString()), 1000)
              end.then(() => clearInterval(interval))
            }),
          resolve: value => value,
        },
      },
    },
  }),
})

self.addEventListener('fetch', yoga)
