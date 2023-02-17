import { createSchema, createYoga } from '../src/index.js'
import { createClient } from 'graphql-sse'

describe('GraphQL over SSE', () => {
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
    graphqlSse: true,
    maskedErrors: false,
  })

  it('should support "distinct connections mode" for single result operations', async () => {
    const client = createClient({
      url: 'http://yoga/graphql',
      fetchFn: yoga.fetch,
      abortControllerImpl: yoga.fetchAPI.AbortController,
      singleConnection: false, // distinct connection mode
      retryAttempts: 0,
    })

    await expect(
      new Promise((resolve, reject) => {
        let result: unknown
        client.subscribe(
          {
            query: /* GraphQL */ `
              {
                hello
              }
            `,
          },
          {
            next: (msg) => (result = msg),
            error: reject,
            complete: () => resolve(result),
          },
        )
      }),
    ).resolves.toMatchInlineSnapshot(`
      {
        "data": {
          "hello": "world",
        },
      }
    `)

    client.dispose()
  })

  it('should support "distinct connections mode" for streaming operations', async () => {
    const client = createClient({
      url: 'http://yoga/graphql',
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
})
