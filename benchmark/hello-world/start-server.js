/* eslint-disable */
const { createServer } = require('http')
const { createYoga, createSchema } = require('graphql-yoga')

const yoga = createYoga({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        greetings: String
      }
    `,
    resolvers: {
      Query: {
        greetings: () => 'This is the `greetings` field of the root `Query` type',
      },
    },
  }),
  logging: false,
  multipart: false,
})

const server = createServer(yoga)

server.listen(4000, '127.0.0.1')
