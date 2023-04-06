import { createYoga, createSchema } from 'graphql-yoga'

// Docs: https://vercel.com/docs/concepts/functions/edge-functions

export const config = {
  runtime: 'edge',
}

const yoga = createYoga({
  graphqlEndpoint: '/api/graphql',
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

export default yoga.handleRequest
