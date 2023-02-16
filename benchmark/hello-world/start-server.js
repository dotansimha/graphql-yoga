/* eslint-disable */
import { createServer } from 'http'
import { createYoga, createSchema } from 'graphql-yoga'
import { useAPQ } from '@graphql-yoga/plugin-apq'
import { useResponseCache } from '@graphql-yoga/plugin-response-cache'
import { useGraphQlJit } from '@envelop/graphql-jit'

const schema = createSchema({
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
})

const yogaMap = {
  '/graphql': createYoga({
    schema,
    logging: false,
    multipart: false,
  }),
  '/graphql-jit': createYoga({
    schema,
    logging: false,
    multipart: false,
    plugins: [useGraphQlJit()],
    graphqlEndpoint: '/graphql-jit',
  }),
  '/graphql-response-cache': createYoga({
    schema,
    logging: false,
    multipart: false,
    plugins: [
      useResponseCache({
        // global cache
        session: () => null,
      }),
    ],
    graphqlEndpoint: '/graphql-response-cache',
  }),
  '/graphql-apq': createYoga({
    schema,
    logging: false,
    multipart: false,
    plugins: [useAPQ()],
    graphqlEndpoint: '/graphql-apq',
  }),
}

const server = createServer((req, res) => {
  const yoga = yogaMap[req.url]
  if (yoga) {
    yoga(req, res)
  } else {
    res.writeHead(404)
    res.end()
  }
})

server.listen(4000, '127.0.0.1')
