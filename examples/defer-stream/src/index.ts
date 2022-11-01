import { yoga } from './yoga.js'
import { createServer } from 'http'

const server = createServer(yoga)
server.listen(4000, () => {
  console.info('Server is running on http://localhost:4000/graphql')
})
