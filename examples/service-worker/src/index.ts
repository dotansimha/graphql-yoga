import { createServer } from '@graphql-yoga/common'

const server = createServer()

self.addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(server.handleRequest(event.request))
})
