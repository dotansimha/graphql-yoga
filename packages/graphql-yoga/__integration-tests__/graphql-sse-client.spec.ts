import { ExecutionResult } from 'graphql'
import { createClient } from 'graphql-sse'
import { createSchema, createYoga } from '../src'

describe('GraphQL SSE Client compatibility', () => {
  const yoga = createYoga({
    schema: createSchema({
      typeDefs: /* GraphQL */ `
        type Query {
          hello: String
        }
        type Subscription {
          greetings: String
        }
      `,
      resolvers: {
        Query: {
          hello: () => 'world',
        },
        Subscription: {
          greetings: {
            async *subscribe() {
              yield { greetings: 'Hi' }
              await new Promise((resolve) => setTimeout(resolve, 300))
              yield { greetings: 'Bonjour' }
              await new Promise((resolve) => setTimeout(resolve, 300))
              yield { greetings: 'Hola' }
              await new Promise((resolve) => setTimeout(resolve, 300))
              yield { greetings: 'Ciao' }
              await new Promise((resolve) => setTimeout(resolve, 300))
              yield { greetings: 'Hallo' }
            },
          },
        },
      },
    }),
  })
  const client = createClient({
    url: 'http://localhost:4000/graphql',
    fetchFn: yoga.fetch,
    abortControllerImpl: yoga.fetchAPI.AbortController,
    retryAttempts: 0,
  })
  let unsubscribe: () => void
  afterAll(() => {
    unsubscribe?.()
    client.dispose()
  })
  it('handle queries', async () => {
    const result = await new Promise((resolve, reject) => {
      let result: ExecutionResult<Record<string, unknown>, unknown>
      unsubscribe = client.subscribe(
        {
          query: '{ hello }',
        },
        {
          next: (data) => (result = data),
          error: reject,
          complete: () => resolve(result),
        },
      )
    })

    expect(result).toEqual({ data: { hello: 'world' } })
  })
  it('handle subscriptions', async () => {
    const onNext = jest.fn()

    await new Promise<void>((resolve, reject) => {
      unsubscribe = client.subscribe(
        {
          query: 'subscription { greetings }',
        },
        {
          next: onNext,
          error: reject,
          complete: resolve,
        },
      )
    })

    expect(onNext).toBeCalledTimes(5) // we say "Hi" in 5 languages
  })
})
