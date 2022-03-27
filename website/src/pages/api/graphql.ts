import { createServer } from '@graphql-yoga/node'

const server = createServer({
  cors: false,
  endpoint: '/api/graphql',
  logging: false,
})

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
}

export default server
