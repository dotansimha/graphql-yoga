import { createSchema, createYoga, Repeater } from '../src/index.js'

function eventStream<TType = unknown>(source: ReadableStream<Uint8Array>) {
  return new Repeater<TType>(async (push, end) => {
    const cancel: Promise<{ done: true }> = end.then(() => ({ done: true }))
    const iterable = source[Symbol.asyncIterator]()
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const result = await Promise.race([cancel, iterable.next()])

      if (result.done) {
        break
      }

      const values = result.value.toString().split('\n\n').filter(Boolean)
      for (const value of values) {
        if (!value.startsWith('data: ')) {
          continue
        }
        const result = value.replace('data: ', '')
        push(JSON.parse(result))
      }
    }

    iterable.return?.()
    end()
  })
}

describe('Subscription', () => {
  test('eventStream', async () => {
    const source = (async function* foo() {
      yield { hi: 'hi' }
      yield { hi: 'hello' }
      yield { hi: 'bonjour' }
    })()

    const schema = createSchema({
      typeDefs: /* GraphQL */ `
        type Subscription {
          hi: String!
        }
        type Query {
          hi: String!
        }
      `,
      resolvers: {
        Subscription: {
          hi: {
            subscribe: () => source,
          },
        },
      },
    })

    const yoga = createYoga({ schema })

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'text/event-stream',
      },
      body: JSON.stringify({
        query: /* GraphQL */ `
          subscription {
            hi
          }
        `,
      }),
    })

    let counter = 0

    for await (const chunk of eventStream(response.body!)) {
      if (counter === 0) {
        expect(chunk).toEqual({ data: { hi: 'hi' } })
        counter++
      } else if (counter === 1) {
        expect(chunk).toEqual({ data: { hi: 'hello' } })
        counter++
      } else if (counter === 2) {
        expect(chunk).toEqual({ data: { hi: 'bonjour' } })
        counter++
      }
    }
  })

  test('should issue pings while connected', async () => {
    const d = createDeferred()

    const schema = createSchema({
      typeDefs: /* GraphQL */ `
        type Subscription {
          hi: String!
        }
        type Query {
          hi: String!
        }
      `,
      resolvers: {
        Subscription: {
          hi: {
            async *subscribe() {
              await d.promise
              yield { hi: 'hi' }
            },
          },
        },
      },
    })

    const yoga = createYoga({ schema })

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'text/event-stream',
      },
      body: JSON.stringify({
        query: /* GraphQL */ `
          subscription {
            hi
          }
        `,
      }),
    })

    const iterator = response.body![Symbol.asyncIterator]()

    const results = []
    let value: Uint8Array

    while (({ value } = await iterator.next())) {
      if (value === undefined) {
        break
      }
      results.push(Buffer.from(value).toString('utf-8'))
      if (results.length === 3) {
        d.resolve()
      }
    }

    expect(results).toMatchInlineSnapshot(`
      [
        ":

      ",
        ":

      ",
        ":

      ",
        "data: {"data":{"hi":"hi"}}

      ",
        "event: complete

      ",
      ]
    `)
  })

  test('should issue pings event if event source never publishes anything', async () => {
    const d = createDeferred()
    const source: AsyncIterableIterator<unknown> = {
      next: () => d.promise.then(() => ({ done: true, value: undefined })),
      return: () => {
        d.resolve()
        return Promise.resolve({ done: true, value: undefined })
      },
      throw: () => {
        throw new Error('Method not implemented. (throw)')
      },
      [Symbol.asyncIterator]() {
        return this
      },
    }

    const schema = createSchema({
      typeDefs: /* GraphQL */ `
        type Subscription {
          hi: String!
        }
        type Query {
          hi: String!
        }
      `,
      resolvers: {
        Subscription: {
          hi: {
            subscribe: () => source,
          },
        },
      },
    })

    const yoga = createYoga({ schema })

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'text/event-stream',
      },
      body: JSON.stringify({
        query: /* GraphQL */ `
          subscription {
            hi
          }
        `,
      }),
    })

    const iterator = response.body![Symbol.asyncIterator]()

    const results = []
    let value: Uint8Array

    while (({ value } = await iterator.next())) {
      if (value === undefined) {
        break
      }
      results.push(Buffer.from(value).toString('utf-8'))
      if (results.length === 4) {
        await iterator.return!()
      }
    }

    await d.promise
    expect(results).toMatchInlineSnapshot(`
      [
        ":

      ",
        ":

      ",
        ":

      ",
        ":

      ",
      ]
    `)
  })
})

type Deferred<T = void> = {
  resolve: (value: T) => void
  reject: (value: unknown) => void
  promise: Promise<T>
}

function createDeferred<T = void>(): Deferred<T> {
  const d = {} as Deferred<T>
  d.promise = new Promise<T>((resolve, reject) => {
    d.resolve = resolve
    d.reject = reject
  })
  return d
}
