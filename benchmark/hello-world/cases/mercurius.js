const Fastify = require('fastify')
const mercurius = require('mercurius')
const createSchema = require('./schema')

const app = Fastify()

app.register(mercurius, {
  schema: createSchema({ stop: () => app.close() }),
  graphiql: false,
})

app.listen(4000)
