import { createYoga } from 'graphql-yoga'
import { createSchema } from 'graphql-yoga/schema'

export const yoga = createYoga({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        greetings: String
      }
    `,
    resolvers: {
      Query: {
        greetings: () => 'Hello world!',
      },
    },
  }),
})
