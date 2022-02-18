import { createServer } from '@graphql-yoga/node'
import { schema } from './schema'

async function main() {
  const server = createServer({ schema })
  await server.start()
}

main()
