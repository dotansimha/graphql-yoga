import { createYoga } from 'graphql-yoga'
import { createSchema } from 'graphql-yoga/schema'

export const yoga = createYoga({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        hello: String
      }
    `,
    resolvers: {
      Query: {
        hello: () => 'Hello world!',
      },
    },
  }),
})
