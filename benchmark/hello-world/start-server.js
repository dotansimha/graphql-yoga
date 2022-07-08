const { createServer } = require('http')
const { createYoga } = require('graphql-yoga')

const yoga = createYoga({
  logging: false,
  multipart: false,
})

const server = createServer(yoga)

server.listen(4000, '127.0.0.1')
