import { createYoga, createSchema } from 'graphql-yoga'
import { createServer } from 'http'
import EventSource from 'eventsource'

describe('subscription', () => {
  test('Subscription is closed properly', async () => {
    let counter = 0
    let resolve: () => void = () => {
      throw new Error('Noop')
    }

    const p = new Promise<IteratorResult<void>>((res) => {
      resolve = () => res({ done: true, value: undefined })
    })

    const fakeIterator: AsyncIterableIterator<unknown> = {
      [Symbol.asyncIterator]: () => fakeIterator,
      next: () => {
        if (counter === 0) {
          counter = counter + 1
          return Promise.resolve({ done: false, value: 'a' })
        }
        return p
      },
      return: jest.fn(() => Promise.resolve({ done: true, value: undefined })),
    }
    const yoga = createYoga({
      logging: false,
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            _: Boolean
          }
          type Subscription {
            foo: String
          }
        `,
        resolvers: {
          Subscription: {
            foo: {
              resolve: () => 'bar',
              subscribe: () => fakeIterator,
            },
          },
        },
      }),
    })
    const server = createServer(yoga)
    try {
      await new Promise<void>((resolve) => server.listen(9876, resolve))

      // Start and Close a HTTP SSE subscription
      await new Promise<void>((res) => {
        const eventSource = new EventSource(
          `http://localhost:9876/graphql?query=subscription{foo}`,
        )
        eventSource.onmessage = (ev) => {
          eventSource.close()
          res()
        }
      })
      resolve()

      // very small timeout to make sure the subscription is closed
      await new Promise((res) => setTimeout(res, 30))
      expect(fakeIterator.return).toHaveBeenCalled()
    } finally {
      await new Promise((resolve) => server.close(resolve))
    }
  })
})
