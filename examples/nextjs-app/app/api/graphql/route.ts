import { createYoga, createSchema } from 'graphql-yoga'

const { handleRequest } = createYoga({
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
  fetchAPI: {
    Response: Response,
    Request: Request,
  },
})

export { handleRequest as GET, handleRequest as POST }
