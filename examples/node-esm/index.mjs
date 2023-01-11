import { createServer } from 'http'

import { yoga } from './yoga.mjs'

const server = createServer(yoga)
server.listen(4000, () => {
  console.info('Server started on http://localhost:4000/graphql')
})
