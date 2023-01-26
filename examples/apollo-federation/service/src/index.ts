import { createServer } from 'http'
import { yoga } from './yoga'

const server = createServer(yoga)

server.listen(4001, () => {
  console.log(`🚀 Server ready at http://localhost:4001`)
})
