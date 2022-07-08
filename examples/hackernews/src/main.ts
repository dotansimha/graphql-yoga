import { createYoga } from 'graphql-yoga'
import { createServer } from 'http'
import { schema } from './schema.js'
import { createContext } from './context.js'

function main() {
  const yoga = createYoga({ schema, context: createContext })
  const server = createServer(yoga)
  server.listen(4000)
}

main()
