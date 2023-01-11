import { createSchema, createYoga } from 'graphql-yoga'

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

console.info(`Server is running on http://${server.hostname}:${server.port}${yoga.graphqlEndpoint}`)
