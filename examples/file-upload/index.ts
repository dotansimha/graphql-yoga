import http from 'http'
import { yoga } from './yoga'

const server = http.createServer(yoga)
server.listen(4000)
