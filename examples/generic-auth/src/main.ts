import { createServer } from 'http'

import { yoga } from './app'

const server = createServer(yoga)
server.listen(4000, () => {
  console.info('Server is running on http://localhost:4000/graphql')
})
