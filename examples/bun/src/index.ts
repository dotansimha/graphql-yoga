import { createYoga, createSchema } from 'graphql-yoga'

const yoga = createYoga({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        hello: String!
      }
    `,
    resolvers: {
      Query: {
        hello: () => 'Hello world!',
      },
    },
  }),
  fetchAPI: globalThis,
})

const server = Bun.serve({
  fetch: yoga.fetch,
  port: 4000,
  hostname: '0.0.0.0',
})

console.info(
  `Server is running on ${new URL(yoga.graphqlEndpoint, server.hostname)}`,
)
