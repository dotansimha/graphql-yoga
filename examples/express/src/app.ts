import { createServer } from 'graphql-yoga'
import express from 'express'

export function buildApp() {
  const app = express()

  const graphQLServer = createServer({
    schema: {
      typeDefs: /* GraphQL */ `
        type Query {
          hello: String
        }
        type Subscription {
          countdown(from: Int!): Int!
        }
      `,
      resolvers: {
        Query: {
          hello: () => 'world',
        },
        Subscription: {
          countdown: {
            subscribe: async function* (_, { from }) {
              for (let i = from; i >= 0; i--) {
                await new Promise((resolve) => setTimeout(resolve, 1000))
                yield { countdown: i }
              }
            },
          },
        },
      },
    },
    logging: false,
  })

  app.use('/graphql', graphQLServer.requestListener)

  return app
}
