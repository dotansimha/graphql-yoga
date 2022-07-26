import { yoga } from './yoga.mjs'
import { createServer } from 'http'

const server = createServer(yoga)
server.listen(4000, () => {
  console.info('Server started on port 4000')
})
