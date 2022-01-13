const { createServer } = require('graphql-yoga')

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
})

server.start()
