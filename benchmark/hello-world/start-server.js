const { createServer } = require('@graphql-yoga/node')

const server = createServer({
  schema: {
    typeDefs: /* GraphQL */ `
      type Query {
        hello: String!
      }
    `,
    resolvers: {
      Query: {
        hello: () => 'Hello World',
      },
    },
  },
  logging: false,
})

server.start()
