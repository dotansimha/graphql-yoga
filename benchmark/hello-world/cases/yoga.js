const { createGraphQLServer } = require('graphql-yoga')
const schema = require('./schema')

const server = createGraphQLServer({
  schema,
  isDev: false,
  enableLogging: false,
})

server.start()
