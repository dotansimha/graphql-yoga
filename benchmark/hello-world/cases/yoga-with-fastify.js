const { createGraphQLServer } = require('graphql-yoga')
const schema = require('./schema')

const graphQLServer = createGraphQLServer({
  schema,
  isDev: false,
  enableLogging: false,
})

const Fastify = require('fastify')

const app = Fastify()

app.route({
  url: '/graphql',
  method: ['GET', 'POST', 'OPTIONS'],
  handler: async (req, reply) => {
    const response = await graphQLServer.handleIncomingMessage(req)
    response.headers.forEach((value, key) => {
      reply.header(key, value)
    })

    reply.status(response.status)
    reply.send(response.body)
  },
})

app.listen(4000)
