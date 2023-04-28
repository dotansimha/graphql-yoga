import { createServer } from 'http'
import { yoga } from './yoga'

const server = createServer(yoga)
server.listen(4000, () => {
  console.log(`Listening on http://localhost:4000${yoga.graphqlEndpoint}`)
})
