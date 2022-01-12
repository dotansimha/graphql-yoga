import { createServer } from 'graphql-yoga'
import fastify, { RouteHandlerMethod } from 'fastify'
import { Readable } from 'stream'
import { useGraphQLModules } from '@envelop/graphql-modules'
import { createApplication } from 'graphql-modules'
import { basicModule } from './modules/basic'

export function createGraphQLApp() {
  return createApplication({
    modules: [basicModule],
  })
}

export const graphqlHandler = (): RouteHandlerMethod => {
  const graphQLServer = createServer({
    plugins: [useGraphQLModules(createGraphQLApp())],
  })

  return async (req, reply) => {
    const response = await graphQLServer.handleIncomingMessage(req)
    response.headers.forEach((value, key) => {
      reply.header(key, value)
    })

    reply.status(response.status)

    const nodeStream = Readable.from(response.body as any)
    reply.send(nodeStream)
  }
}

export function buildApp() {
  const app = fastify({ logger: true })

  app.route({
    url: '/graphql',
    method: ['GET', 'POST', 'OPTIONS'],
    handler: graphqlHandler(),
  })

  return app
}
