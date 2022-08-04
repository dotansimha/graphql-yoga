import { getIntrospectionQuery } from 'graphql'
import { createYoga, createSchema, Repeater } from 'graphql-yoga'
import { Request } from '@whatwg-node/fetch'

const listenerMap = new Map<string, Set<EventListenerOrEventListenerObject>>()

globalThis.self = {
  addEventListener(
    eventName: string,
    listener: EventListenerOrEventListenerObject,
  ) {
    let listeners = listenerMap.get(eventName)
    if (!listeners) {
      listeners = new Set()
      listenerMap.set(eventName, listeners)
    }
    listeners.add(listener)
  },
  removeEventListener(
    eventName: string,
    listener: EventListenerOrEventListenerObject,
  ) {
    const listeners = listenerMap.get(eventName)
    if (listeners) {
      listeners.delete(listener)
    }
  },
} as any

function trigger(eventName: string, data: any) {
  listenerMap.get(eventName)?.forEach((listener: any) => {
    const listenerFn = listener.handleEvent ?? listener
    listenerFn(data)
  })
}

describe('Service worker', () => {
  const yoga = createYoga({
    schema: createSchema({
      typeDefs: /* GraphQL */ `
        type Query {
          greetings: String
        }

        type Subscription {
          time: String
        }
      `,
      resolvers: {
        Query: {
          greetings: () => 'Hello world!',
        },
        Subscription: {
          time: {
            subscribe: () =>
              new Repeater(async (push, end) => {
                const interval = setInterval(() => {
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

  beforeEach(() => {
    self.addEventListener('fetch', yoga)
  })
  afterEach(() => {
    self.removeEventListener('fetch', yoga)
  })
  it('should add fetch listener', async () => {
    expect(listenerMap.get('fetch')?.size).toBe(1)
  })

  it('should render GraphiQL', async () => {
    const response: Response = await new Promise((respondWith) => {
      trigger('fetch', {
        request: new Request('http://localhost:3000/graphql', {
          method: 'GET',
          headers: {
            Accept: 'text/html',
          },
        }),
        respondWith,
      })
    })
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/html')
    expect(await response.text()).toMatch(/GraphiQL/)
  })

  it('succeeds introspection query', async () => {
    const response: Response = await new Promise((respondWith) => {
      trigger('fetch', {
        request: new Request('http://localhost:3000/graphql', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: getIntrospectionQuery(),
          }),
        }),
        respondWith,
      })
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/json')
    expect(await response.json()).toMatchObject({
      data: {
        __schema: {
          queryType: {
            name: 'Query',
          },
        },
      },
    })
  })

  it('handles subscriptions', async () => {
    const response: Response = await new Promise((respondWith) => {
      trigger('fetch', {
        request: new Request('http://localhost:3000/graphql', {
          method: 'POST',
          headers: {
            Accept: 'text/event-stream',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: /* GraphQL */ `
              subscription {
                time
              }
            `,
          }),
        }),
        respondWith,
      })
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/event-stream')
    const responseBodyIterator = response.body?.[Symbol.asyncIterator]()
    const { value, done } = await responseBodyIterator!.next()
    expect(done).toBe(false)
    expect(value.toString()).toMatch(/data: {/)
    await responseBodyIterator!.return?.()
  })
})
