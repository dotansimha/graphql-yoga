import { createYoga, createSchema } from 'graphql-yoga'

declare const GRAPHQL_ENDPOINT: string

const { fetch } = createYoga({
  graphqlEndpoint: GRAPHQL_ENDPOINT || '/graphql',
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        greetings: String
      }
    `,
    resolvers: {
      Query: {
        greetings: () =>
          'This is the `greetings` field of the root `Query` type',
      },
    },
  }),
})

export default { fetch }
