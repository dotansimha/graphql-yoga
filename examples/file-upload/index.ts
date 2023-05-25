import http from 'node:http'
import { yoga } from './yoga'

const server = http.createServer(yoga)
server.listen(4000, () => {
  console.log(
    `Server listening on http://localhost:4000${yoga.graphqlEndpoint}`,
  )
})
