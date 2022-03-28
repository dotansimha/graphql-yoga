import { createServer } from '@graphql-yoga/common'

const yoga = createServer({
  graphiql: {
    endpoint: GRAPHQL_ROUTE,
  },
})

self.addEventListener('fetch', (event) => {
  event.respondWith(yoga.handleRequest(event.request))
})
