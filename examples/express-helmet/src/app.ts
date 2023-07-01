import { createYoga, createSchema } from 'graphql-yoga'
import express from 'express'
import helmet from 'helmet'

export function buildApp(app: ReturnType<typeof express>) {
  const graphQLServer = createYoga({
    schema: createSchema({
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
            async *subscribe(_, { from }) {
              for (let i = from; i >= 0; i--) {
                await new Promise((resolve) => setTimeout(resolve, 1000))
                yield { countdown: i }
              }
            },
          },
        },
      },
    }),
    logging: false,
  })

  const router = express.Router()

  // Add specific CSP for GraphiQL by using an express router
  router.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          'style-src': ["'self'", 'unpkg.com'],
          'script-src': ["'self'", 'unpkg.com', "'unsafe-inline'"],
          'img-src': ["'self'", 'raw.githubusercontent.com'],
        },
      },
    }),
  )

  router.use(graphQLServer)

  // First register the router, to avoid Global CSP configuration to override the specific one
  app.use(graphQLServer.graphqlEndpoint, router)

  // Global CSP configuration
  app.use(helmet())

  // Rest of the routes
  app.get('/', (req, res) => {
    res.send('Hello World!')
  })

  return graphQLServer.graphqlEndpoint
}
