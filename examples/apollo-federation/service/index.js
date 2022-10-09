const { createServer } = require('http')
const { yoga } = require('./yoga')

const server = createServer(yoga)

server.listen(4001, () => {
  console.log(`🚀 Server ready at http://localhost:4001`)
})
