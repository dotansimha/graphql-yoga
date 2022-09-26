import { createServer } from 'http'
import { yoga } from './yoga'

const server = createServer(yoga)
server.listen(4000)
