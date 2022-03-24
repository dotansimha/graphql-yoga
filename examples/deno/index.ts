import { serve } from 'https://deno.land/std@0.117.0/http/server.ts'
import { createServer } from 'https://cdn.skypack.dev/@graphql-yoga/common@beta?dts'

const graphQLServer = createServer()

serve((req) => graphQLServer.handleRequest(req), {
  addr: ':4000',
})

console.log('Server is running on http://localhost:4000/graphql')
