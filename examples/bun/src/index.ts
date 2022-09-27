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

const server = Bun.serve(yoga)

console.info(
  `Server is running on ${new URL(yoga.graphqlEndpoint, server.hostname)}`,
)
