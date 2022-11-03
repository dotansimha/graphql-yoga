/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const { createServer } = require('node:http')
const { createYoga, createSchema } = require('graphql-yoga')

const yoga = createYoga({
  schema: createSchema({
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
  }),
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
server.listen(4000, () => {
  console.log('Server is running on http://localhost:4000/graphql')
})
