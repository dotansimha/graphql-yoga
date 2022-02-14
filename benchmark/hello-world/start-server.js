const { createServer } = require('@graphql-yoga/node')

const server = createServer({
  logging: false,
})

server.start()
