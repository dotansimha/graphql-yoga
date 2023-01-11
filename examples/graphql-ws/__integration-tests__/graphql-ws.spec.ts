import { createServer } from 'http'

import { createClient } from 'graphql-ws'
import { useServer } from 'graphql-ws/lib/use/ws'
import { createSchema, createYoga } from 'graphql-yoga'
import WebSocket from 'ws'

import { buildApp } from '../src/app.js'

describe('graphql-ws example integration', () => {
  const app = buildApp()
  beforeAll(() => app.start(4000))
  afterAll(() => app.stop())

  it('should execute query', async () => {
    const client = createClient({
      webSocketImpl: WebSocket,
      url: 'ws://localhost:4000/graphql',
      retryAttempts: 0, // fail right away
    })

    const onNext = jest.fn()

    await new Promise<void>((resolve, reject) => {
      client.subscribe(
        { query: '{ hello }' },
        {
          next: onNext,
          error: reject,
          complete: resolve,
        },
      )
    })

    expect(onNext).toBeCalledWith({ data: { hello: 'world' } })
  })

  it('should execute mutation', async () => {
    const client = createClient({
      webSocketImpl: WebSocket,
      url: 'ws://localhost:4000/graphql',
      retryAttempts: 0, // fail right away
    })

    const onNext = jest.fn()

    await new Promise<void>((resolve, reject) => {
      client.subscribe(
        { query: 'mutation { dontChange }' },
        {
          next: onNext,
          error: reject,
          complete: resolve,
        },
      )
    })

    expect(onNext).toBeCalledWith({ data: { dontChange: 'didntChange' } })
  })

  it('should subscribe', async () => {
    const client = createClient({
      webSocketImpl: WebSocket,
      url: 'ws://localhost:4000/graphql',
      retryAttempts: 0, // fail right away
    })

    const onNext = jest.fn()

    await new Promise<void>((resolve, reject) => {
      client.subscribe(
        { query: 'subscription { greetings }' },
        {
          next: onNext,
          error: reject,
          complete: resolve,
        },
      )
    })

    expect(onNext).toBeCalledTimes(5)
    expect(onNext).toBeCalledWith({ data: { greetings: 'Hi' } })
  })

  it('should not fail if context is not as per the documentation', async () => {
    const yoga = createYoga({
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            hello: String!
          }
        `,
        resolvers: {
          Query: {
            hello() {
              return 'world'
            },
          },
        },
      }),
    })

    const server = createServer(yoga)

    const wsServer = useServer(
      {
        execute: (args: any) => args.execute(args),
        subscribe: (args: any) => args.subscribe(args),
        onSubscribe: async (_ctx, msg) => {
          const { schema, execute, subscribe, contextFactory, parse, validate } =
            yoga.getEnveloped() // <- malformed/missing context

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
      new WebSocket.WebSocketServer({
        server,
        path: yoga.graphqlEndpoint,
      }),
    )

    await new Promise<void>((resolve, reject) => {
      server.on('error', err => reject(err))
      server.on('listening', () => resolve())
      server.listen(4001)
    })

    //

    const client = createClient({
      webSocketImpl: WebSocket,
      url: 'ws://localhost:4001/graphql',
      retryAttempts: 0, // fail right away
    })

    const onNext = jest.fn()

    await new Promise<void>((resolve, reject) => {
      client.subscribe(
        { query: '{ hello }' },
        {
          next: onNext,
          error: reject,
          complete: resolve,
        },
      )
    })

    expect(onNext).toBeCalledTimes(1)
    expect(onNext).toBeCalledWith({ data: { hello: 'world' } })

    //

    await client.dispose()
    await wsServer.dispose()
    await new Promise<void>(resolve => {
      server.close(() => resolve())
    })
  })
})
