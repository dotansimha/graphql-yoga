const { createServer } = require('graphql-yoga')

const server = createServer({
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
  isDev: false,
  enableLogging: false,
})

server.start()
