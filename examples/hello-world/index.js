const { createServer } = require('@graphql-yoga/node')

const server = createServer({
  schema: {
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
  },
  graphiql: {
    title: 'Hello World',
    defaultQuery: /* GraphQL */ `
      {
        hello
      }
    `,
  },
})

server.start()
