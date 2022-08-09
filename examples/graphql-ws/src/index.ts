import { createYoga, createSchema, Repeater } from 'graphql-yoga'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { useServer } from 'graphql-ws/lib/use/ws'

async function main() {
  const yogaApp = createYoga({
    graphiql: {
      subscriptionsProtocol: 'WS',
    },
    schema: createSchema({
      typeDefs: /* GraphQL */ `
        type Query {
          hello: String!
        }
        type Subscription {
          currentTime: String
        }
      `,
      resolvers: {
        Query: {
          hello: () => 'Hi there.',
        },
        Subscription: {
          currentTime: {
            subscribe: () =>
              new Repeater(async (push, end) => {
                const interval = setInterval(() => {
                  console.log('Publish new time')
                  push({ currentTime: new Date().toISOString() })
                }, 1000)
                end.then(() => clearInterval(interval))
                await end
              }),
          },
        },
      },
    }),
  })

  const httpServer = createServer(yogaApp)
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  })

  useServer(
    {
      execute: (args: any) => args.rootValue.execute(args),
      subscribe: (args: any) => args.rootValue.subscribe(args),
      onSubscribe: async (context, msg) => {
        const { schema, execute, subscribe, contextFactory, parse, validate } =
          yogaApp.getEnveloped(context)
        const args = {
          schema,
          operationName: msg.payload.operationName,
          document: parse(msg.payload.query),
          variableValues: msg.payload.variables,
          contextValue: await contextFactory(context),
          rootValue: {
            execute,
            subscribe,
          },
        }

        const errors = validate(args.schema, args.document)
        if (errors.length) return errors
        return args
      },
    },
    wsServer,
  )

  httpServer.listen(4000)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
