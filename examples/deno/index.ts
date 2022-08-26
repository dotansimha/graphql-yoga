import { serve } from 'https://deno.land/std@0.153.0/http/server.ts'
import { createServer } from 'https://cdn.skypack.dev/@graphql-yoga/common?dts'

const graphQLServer = createServer()

serve(graphQLServer, {
  port: 4000,
})

console.log('Server is running on http://localhost:4000/graphql')
