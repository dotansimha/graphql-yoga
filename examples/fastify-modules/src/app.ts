import 'reflect-metadata'
import { createYoga } from 'graphql-yoga'
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

export function createGraphQLHandler(): RouteHandlerMethod & {
  endpoint: string
} {
  const graphQLServer = createYoga<{
    req: FastifyRequest
    reply: FastifyReply
  }>({
    logging: false,
    plugins: [useGraphQLModules(createGraphQLApp())],
  })

  const handler = async (req, reply) => {
    const response = await graphQLServer.handleNodeRequest(req, {
      req,
      reply,
    })
    response.headers.forEach((value, key) => {
      reply.header(key, value)
    })

    reply.status(response.status)

    reply.send(response.body)

    return reply
  }

  handler.endpoint = graphQLServer.graphqlEndpoint
  return handler
}

export function buildApp() {
  const app = fastify({ logger: false })
  const handler = createGraphQLHandler()

  app.route({
    url: handler.endpoint,
    method: ['GET', 'POST', 'OPTIONS'],
    handler,
  })

  return [app, handler.endpoint] as const
}
