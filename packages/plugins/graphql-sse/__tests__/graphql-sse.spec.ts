import { createYoga, createSchema } from 'graphql-yoga'
import { createClient } from 'graphql-sse'
import { useGraphQLSSE } from '../src/index.js'

describe('graphql-sse', () => {
  const schema = createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        hello: String!
      }
      type Subscription {
        greetings: String!
      }
    `,
    resolvers: {
      Query: {
        async hello() {
          return 'world'
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
  })

  const yoga = createYoga({
    schema,
    plugins: [useGraphQLSSE()],
    maskedErrors: false,
  })

  it('should stream using distinct connection mode', async () => {
    const client = createClient({
      url: 'http://yoga/graphql/stream',
      fetchFn: yoga.fetch,
      abortControllerImpl: yoga.fetchAPI.AbortController,
      singleConnection: false, // distinct connection mode
      retryAttempts: 0,
    })

    await expect(
      new Promise((resolve, reject) => {
        const msgs: unknown[] = []
        client.subscribe(
          {
            query: /* GraphQL */ `
              subscription {
                greetings
              }
            `,
          },
          {
            next: (msg) => msgs.push(msg),
            error: reject,
            complete: () => resolve(msgs),
          },
        )
      }),
    ).resolves.toMatchInlineSnapshot(`
      [
        {
          "data": {
            "greetings": "Hi",
          },
        },
        {
          "data": {
            "greetings": "Bonjour",
          },
        },
        {
          "data": {
            "greetings": "Hola",
          },
        },
        {
          "data": {
            "greetings": "Ciao",
          },
        },
        {
          "data": {
            "greetings": "Zdravo",
          },
        },
      ]
    `)

    client.dispose()
  })

  it('should stream using single connection and lazy mode', async () => {
    const client = createClient({
      url: 'http://yoga/graphql/stream',
      fetchFn: yoga.fetch,
      abortControllerImpl: yoga.fetchAPI.AbortController,
      singleConnection: true, // single connection mode
      lazy: true,
      retryAttempts: 0,
    })

    await expect(
      new Promise((resolve, reject) => {
        const msgs: unknown[] = []
        client.subscribe(
          {
            query: /* GraphQL */ `
              subscription {
                greetings
              }
            `,
          },
          {
            next: (msg) => msgs.push(msg),
            error: reject,
            complete: () => resolve(msgs),
          },
        )
      }),
    ).resolves.toMatchInlineSnapshot(`
      [
        {
          "data": {
            "greetings": "Hi",
          },
        },
        {
          "data": {
            "greetings": "Bonjour",
          },
        },
        {
          "data": {
            "greetings": "Hola",
          },
        },
        {
          "data": {
            "greetings": "Ciao",
          },
        },
        {
          "data": {
            "greetings": "Zdravo",
          },
        },
      ]
    `)

    client.dispose()
  })

  it('should stream using single connection and non-lazy mode', async () => {
    const client = createClient({
      url: 'http://yoga/graphql/stream',
      fetchFn: yoga.fetch,
      abortControllerImpl: yoga.fetchAPI.AbortController,
      singleConnection: true, // single connection mode
      lazy: false,
      retryAttempts: 0,
    })

    await expect(
      new Promise((resolve, reject) => {
        const msgs: unknown[] = []
        client.subscribe(
          {
            query: /* GraphQL */ `
              subscription {
                greetings
              }
            `,
          },
          {
            next: (msg) => msgs.push(msg),
            error: reject,
            complete: () => resolve(msgs),
          },
        )
      }),
    ).resolves.toMatchInlineSnapshot(`
      [
        {
          "data": {
            "greetings": "Hi",
          },
        },
        {
          "data": {
            "greetings": "Bonjour",
          },
        },
        {
          "data": {
            "greetings": "Hola",
          },
        },
        {
          "data": {
            "greetings": "Ciao",
          },
        },
        {
          "data": {
            "greetings": "Zdravo",
          },
        },
      ]
    `)

    client.dispose()
  })

  it('should use CORS settings from the server', async () => {
    const yoga = createYoga({
      schema,
      cors: {
        origin: 'http://yoga',
        credentials: true,
        allowedHeaders: ['x-some-header'],
        methods: ['GET', 'POST', 'DELETE', 'PUT'],
      },
      plugins: [useGraphQLSSE()],
      maskedErrors: false,
    })

    const res = await yoga.fetch('http://yoga/graphql/stream', {
      method: 'OPTIONS',
    })

    expect(res.headers).toMatchInlineSnapshot(`
      Headers {
        Symbol(map): {
          "Access-Control-Allow-Credentials": [
            "true",
          ],
          "Access-Control-Allow-Headers": [
            "x-some-header",
          ],
          "Access-Control-Allow-Methods": [
            "GET, POST, DELETE, PUT",
          ],
          "Access-Control-Allow-Origin": [
            "http://yoga",
          ],
          "Content-Length": [
            "0",
          ],
        },
      }
    `)
  })
})
