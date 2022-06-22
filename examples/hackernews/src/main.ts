import { createServer } from '@graphql-yoga/node'
import { schema } from './schema.js'
import { createContext } from './context.js'

async function main() {
  const server = createServer({ schema, context: createContext })
  await server.start()
}

main()
