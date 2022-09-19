import { createServer } from 'http'
import { yoga } from './app'

const server = createServer(yoga)
server.listen(4000)
