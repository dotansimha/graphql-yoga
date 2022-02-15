const { createServer } = require('@graphql-yoga/node')

const server = createServer({
  typeDefs: /* GraphQL */ `
    type Query {
      hello(name: String): String!
    }
  `,
  resolvers: {
    Query: {
      hello: (_, { name }) => `Hello ${name || 'World'}`,
    },
  },
})

server.start()
