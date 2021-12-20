const { createServer } = require('graphql-yoga')
const createSchema = require('./schema')

const server = createServer({
  schema: createSchema({ stop: () => server.stop() }),
  isDev: false,
  enableLogging: false,
})

server.start()
