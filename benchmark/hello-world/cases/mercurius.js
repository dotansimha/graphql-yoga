const Fastify = require('fastify')
const mercurius = require('mercurius')
const schema = require('./schema')

const app = Fastify()

app.register(mercurius, {
  schema,
  graphiql: false,
})

app.listen(4000)
