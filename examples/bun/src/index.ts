import { createYoga, createSchema } from 'graphql-yoga'

const yoga = createYoga({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        greetings: String
      }
    `,
    resolvers: {
      Query: {
        greetings: () => 'Hello Bun!',
      },
    },
  }),
})

Bun.serve(yoga)

console.info(`Server is running on http://127.0.0.1:3000/graphql`)
