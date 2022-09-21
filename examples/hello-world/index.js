/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line no-undef
const { createServer } = require('node:http')
// eslint-disable-next-line no-undef
const { createYoga, createSchema } = require('graphql-yoga')
const { useSofa, useSofaWithSwaggerUI } = require('@graphql-yoga/plugin-sofa')

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
  plugins: [
    useSofaWithSwaggerUI({
      basePath: '/api',
      swaggerUIPath: '/swagger',
    })
  ]
})

const server = createServer(yoga)
server.listen(4000, () => {
  console.log('Server is running on http://localhost:4000/graphql')
})
