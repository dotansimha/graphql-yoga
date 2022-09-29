import { createYoga, createSchema } from 'graphql-yoga'

declare const GRAPHQL_ENDPOINT: string

const { fetch } = createYoga({
  graphqlEndpoint: GRAPHQL_ENDPOINT || '/graphql',
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
        greetings: () =>
          'This is the `greetings` field of the root `Query` type',
      },
      Subscription: {
        time: {
          subscribe: () =>
            new Repeater((push, end) => {
              const interval = setInterval(
                () => push(new Date().toISOString()),
                1000,
              )
              end.then(() => clearInterval(interval))
            }),
          resolve: (value) => value,
        },
      },
    },
  }),
})

export default { fetch }
