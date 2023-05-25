import { Socket } from 'node:net'
import { createServer } from 'node:http'
import { WebSocketServer } from 'ws'
import { createYoga, createSchema } from 'graphql-yoga'
import { useServer } from 'graphql-ws/lib/use/ws'

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
  })

  const server = createServer(yoga)
  const wss = new WebSocketServer({
    server,
    path: yoga.graphqlEndpoint,
  })

  useServer(
    {
      execute: (args: any) => args.execute(args),
      subscribe: (args: any) => args.subscribe(args),
      onSubscribe: async (ctx, msg) => {
        const { schema, execute, subscribe, contextFactory, parse, validate } =
          yoga.getEnveloped({
            ...ctx,
            req: ctx.extra.request,
            socket: ctx.extra.socket,
            params: msg.payload,
          })

        const args = {
          schema,
          operationName: msg.payload.operationName,
          document: parse(msg.payload.query),
          variableValues: msg.payload.variables,
          contextValue: await contextFactory(),
          execute,
          subscribe,
        }

        const errors = validate(args.schema, args.document)
        if (errors.length) return errors
        return args
      },
    },
    wss,
  )

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
