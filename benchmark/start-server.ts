/* eslint-disable */
import { createServer, type RequestListener } from 'http'
import { createYoga } from 'graphql-yoga'
import { useResponseCache } from '@graphql-yoga/plugin-response-cache'
import { useGraphQlJit } from '@envelop/graphql-jit'
import { Context, schema } from './schema.js'

const yogaMap: Record<string, RequestListener> = {
  '/graphql': createYoga<Context>({
    schema,
    logging: false,
    multipart: false,
  }),
  '/graphql-jit': createYoga<Context>({
    schema,
    logging: false,
    multipart: false,
    plugins: [useGraphQlJit()],
    graphqlEndpoint: '/graphql-jit',
  }),
  '/graphql-response-cache': createYoga<Context>({
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
  '/graphql-no-parse-validate-cache': createYoga<Context>({
    schema,
    logging: false,
    multipart: false,
    parserAndValidationCache: false,
    graphqlEndpoint: '/graphql-no-parse-validate-cache',
  }),
  '/ping': (req, res) => {
    res.writeHead(200)
    res.end()
  },
}

const server = createServer((req, res) => {
  const yoga = yogaMap[req.url!]
  if (yoga) {
    yoga(req, res)
  } else {
    res.writeHead(404)
    res.end()
  }
})

server.listen(4000, () => {
  console.log('ready')
})
