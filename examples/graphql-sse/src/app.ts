import { Socket } from 'net'
import { createServer } from 'http'
import { createYoga, createSchema } from 'graphql-yoga'
import { useGraphQLSSE } from '@graphql-yoga/plugin-graphql-sse'

export function buildApp() {
  const yoga = createYoga({
    schema: createSchema({
      typeDefs: /* GraphQL */ `
        type Query {
          hello: String!
        }
        type Mutation {
          dontChange: String!
        }
        type Subscription {
          greetings: String!
        }
      `,
      resolvers: {
        Query: {
          hello() {
            return 'world'
          },
        },
        Mutation: {
          dontChange() {
            return 'didntChange'
          },
        },
        Subscription: {
          greetings: {
            async *subscribe() {
              for (const hi of ['Hi', 'Bonjour', 'Hola', 'Ciao', 'Zdravo']) {
                yield { greetings: hi }
              }
            },
          },
        },
      },
    }),
    plugins: [useGraphQLSSE()],
  })

  const server = createServer(yoga)

  // for termination
  const sockets = new Set<Socket>()
  server.on('connection', (socket) => {
    sockets.add(socket)
    server.once('close', () => sockets.delete(socket))
  })

  return {
    start: (port: number) =>
      new Promise<void>((resolve, reject) => {
        server.on('error', (err) => reject(err))
        server.on('listening', () => resolve())
        server.listen(port)
      }),
    stop: () =>
      new Promise<void>((resolve) => {
        for (const socket of sockets) {
          socket.destroy()
          sockets.delete(socket)
        }
        server.close(() => resolve())
      }),
  }
}
