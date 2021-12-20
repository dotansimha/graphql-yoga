const { createServer } = require('graphql-yoga')
const schema = require('./schema')

const server = createServer({
  schema,
  isDev: false,
  enableLogging: false,
})

server.start()
