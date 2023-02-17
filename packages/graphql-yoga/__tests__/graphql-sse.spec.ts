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
        waitForPings: String!
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
        waitForPings: {
          // eslint-disable-next-line require-yield
          async *subscribe() {
            // a ping is issued every 5ms, wait for a few and just return
            await new Promise((resolve) => setTimeout(resolve, 35))
            return
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

  describe('Distinct connections mode', () => {
    test('should issue pings while connected', async () => {
      const res = await yoga.fetch(
        'http://yoga/graphql?query=subscription{waitForPings}',
        {
          headers: {
            accept: 'text/event-stream',
          },
        },
      )
      expect(res.ok).toBeTruthy()
      await expect(res.text()).resolves.toMatchInlineSnapshot(`
        ":

        :

        :

        event: complete

        "
      `)
    })

    it('should support single result operations', async () => {
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

    it('should support streaming operations', async () => {
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

    it('should report errors through the stream', async () => {
      const res = await yoga.fetch('http://yoga/graphql?query={nope}', {
        headers: {
          accept: 'text/event-stream',
        },
      })
      expect(res.ok).toBeTruthy()
      await expect(res.text()).resolves.toMatchInlineSnapshot(`
        "event: next
        data: {"errors":[{"message":"Cannot query field \\"nope\\" on type \\"Query\\".","locations":[{"line":1,"column":2}]}]}

        event: complete

        "
      `)
    })
  })

  it.todo('Single connections mode')
})
