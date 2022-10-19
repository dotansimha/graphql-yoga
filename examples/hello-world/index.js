/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line no-undef
const { createServer } = require('node:http')
// eslint-disable-next-line no-undef
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
  // eslint-disable-next-line no-undef
  console.log('Server listening on http://localhost:4000/graphql')
})
