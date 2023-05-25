import { createYoga } from 'graphql-yoga'
import { createServer } from 'node:http'
import { schema } from './schema'
import { createContext } from './context'

function main() {
  const yoga = createYoga({ schema, context: createContext })
  const server = createServer(yoga)
  server.listen(4000, () => {
    console.info(
      `Server is running on http://localhost:4000${yoga.graphqlEndpoint}`,
    )
  })
}

main()
