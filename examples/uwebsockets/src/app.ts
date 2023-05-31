import { App, HttpRequest, HttpResponse } from 'uWebSockets.js'
import { createSchema, createYoga, Repeater } from 'graphql-yoga'
import { makeBehavior } from 'graphql-ws/lib/use/uWebSockets'
import { ExecutionArgs, execute, subscribe } from 'graphql'

interface ServerContext {
  req: HttpRequest
  res: HttpResponse
}

export const yoga = createYoga<ServerContext>({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        hello: String!
      }

      type Subscription {
        time: String!
      }
    `,
    resolvers: {
      Query: {
        hello: () => 'Hello world!',
      },
      Subscription: {
        time: {
          subscribe: () =>
            new Repeater((push, stop) => {
              const interval = setInterval(() => {
                push({
                  time: new Date().toISOString(),
                })
              }, 1000)
              stop.then(() => clearInterval(interval))
            }),
        },
      },
    },
  }),
  graphiql: {
    subscriptionsProtocol: 'WS', // use WebSockets instead of SSE
  },
})

// yoga's envelop may augment the `execute` and `subscribe` operations
// so we need to make sure we always use the freshest instance
type EnvelopedExecutionArgs = ExecutionArgs & {
  rootValue: {
    execute: typeof execute
    subscribe: typeof subscribe
  }
}

const wsHandler = makeBehavior({
  execute: (args) => (args as EnvelopedExecutionArgs).rootValue.execute(args),
  subscribe: (args) =>
    (args as EnvelopedExecutionArgs).rootValue.subscribe(args),
  onSubscribe: async (ctx, msg) => {
    const { schema, execute, subscribe, contextFactory, parse, validate } =
      yoga.getEnveloped(ctx)

    const args: EnvelopedExecutionArgs = {
      schema,
      operationName: msg.payload.operationName,
      document: parse(msg.payload.query),
      variableValues: msg.payload.variables,
      contextValue: await contextFactory(),
      rootValue: {
        execute,
        subscribe,
      },
    }

    const errors = validate(args.schema, args.document)
    if (errors.length) return errors
    return args
  },
})

export const app = App().any('/*', yoga).ws(yoga.graphqlEndpoint, wsHandler)
