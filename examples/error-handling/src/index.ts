import { createServer } from 'http'
import { yoga } from './yoga'

// Start the server and explore http://localhost:4000/graphql
const server = createServer(yoga)
server.listen(4000)
