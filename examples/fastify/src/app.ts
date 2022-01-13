import { createServer } from 'graphql-yoga'
import fastify from 'fastify'
import { Readable } from 'stream'

export function buildApp() {
  const app = fastify({ logger: true })

  const graphQLServer = createServer({
    schema: {
      typeDefs: /* GraphQL */ `
        type Query {
          hello: String
        }
        type Mutation {
          hello: String
        }
        type Subscription {
          countdown(from: Int!, interval: Int!): Int!
        }
      `,
      resolvers: {
        Query: {
          hello: () => 'world',
        },
        Mutation: {
          hello: () => 'world',
        },
        Subscription: {
          countdown: {
            subscribe: async function* (_, { from, interval }) {
              for (let i = from; i >= 0; i--) {
                await new Promise((resolve) =>
                  setTimeout(resolve, interval ?? 1000),
                )
                yield { countdown: i }
              }
            },
          },
        },
      },
    },
    // Integrate Fastify Logger to Yoga
    logger: app.log,
  })

  app.route({
    url: '/graphql',
    method: ['GET', 'POST', 'OPTIONS'],
    handler: async (req, reply) => {
      const response = await graphQLServer.handleIncomingMessage(req)
      response.headers.forEach((value, key) => {
        reply.header(key, value)
      })

      reply.status(response.status)
      const nodeStream = Readable.from(response.body as any)
      reply.send(nodeStream)
    },
  })

  return app
}
