import 'reflect-metadata'
import { createServer } from '@graphql-yoga/node'
import { Readable } from 'stream'
import fastify, {
  FastifyReply,
  FastifyRequest,
  RouteHandlerMethod,
} from 'fastify'
import { useGraphQLModules } from '@envelop/graphql-modules'
import { createApplication } from 'graphql-modules'
import { basicModule } from './modules/basic'

export function createGraphQLApp() {
  return createApplication({
    modules: [basicModule],
  })
}

export const graphqlHandler = (): RouteHandlerMethod => {
  const graphQLServer = createServer<{
    req: FastifyRequest
    reply: FastifyReply
  }>({
    logging: false,
    plugins: [useGraphQLModules(createGraphQLApp())],
  })

  return async (req, reply) => {
    const response = await graphQLServer.handleIncomingMessage(req, {
      req,
      reply,
    })
    response.headers.forEach((value, key) => {
      reply.header(key, value)
    })

    reply.status(response.status)

    const nodeStream = Readable.from(response.body)
    reply.send(nodeStream)
  }
}

export function buildApp() {
  const app = fastify({ logger: false })

  app.route({
    url: '/graphql',
    method: ['GET', 'POST', 'OPTIONS'],
    handler: graphqlHandler(),
  })

  return app
}
