const { createServer } = require('http')
const { createYoga } = require('graphql-yoga')

const yoga = createYoga({
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

const server = createServer(yoga)
server.listen(4000)
