import { yoga } from './yoga.mjs'
import { createServer } from 'node:http'

const server = createServer(yoga)
server.listen(4000, () => {
  console.info(`Server started on http://localhost:4000${yoga.graphqlEndpoint}`)
})
