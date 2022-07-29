// src/index.mjs
import { createYoga } from 'graphql-yoga'
import { createSchema } from 'graphql-yoga/schema'

export default createYoga({
  graphqlEndpoint: '/graphql',
  landingPage: false,
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
