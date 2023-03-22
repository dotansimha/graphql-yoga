import { createYoga, createSchema } from 'graphql-yoga'

export const yoga = createYoga({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        hello: String!
      }
    `,
    resolvers: {
      Query: {
        hello: () => 'Hello Deno!',
      },
    },
  }),
})
