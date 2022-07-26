import { serve } from 'https://deno.land/std@0.117.0/http/server.ts'
import { createYoga } from 'https://cdn.skypack.dev/graphql-yoga'

const yoga = createYoga()

serve(yoga, {
  addr: ':4000',
})

console.log('Server is running on http://localhost:4000/graphql')
