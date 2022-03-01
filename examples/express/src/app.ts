import { createServer } from '@graphql-yoga/node'
import express from 'express'

export function buildApp() {
  const app = express()

  const graphQLServer = createServer({
    schema: {
      typeDefs: /* GraphQL */ `
        scalar File
        type Query {
          hello: String
        }
        type Mutation {
          getFileName(file: File!): String
        }
        type Subscription {
          countdown(from: Int!): Int!
        }
      `,
      resolvers: {
        Query: {
          hello: () => 'world',
        },
        Mutation: {
          getFileName: (root, { file }: { file: File }) => file.name,
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
