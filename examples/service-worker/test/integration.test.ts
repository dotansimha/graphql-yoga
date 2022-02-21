import makeServiceWorkerEnv from 'service-worker-mock'
import { getIntrospectionQuery } from 'graphql'

describe('Service worker', () => {
  beforeEach(() => {
    const serviceWorkerEnv = makeServiceWorkerEnv()
    Object.defineProperty(serviceWorkerEnv, 'addEventListener', {
      value: serviceWorkerEnv.addEventListener,
      enumerable: true,
    })
    Object.assign(global, serviceWorkerEnv)
    jest.resetModules()
  })

  it('should add fetch listener', async () => {
    require('../src/index.ts')

    expect(self.listeners.get('fetch')).toBeDefined()
  })

  it('should render GraphiQL', async () => {
    require('../src/index.ts')

    const response = await self.trigger(
      'fetch',
      new Request('/graphql', {
        method: 'GET',
        headers: {
          Accept: 'text/html',
        },
      }),
    )
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/html')
    expect(await response.text()).toMatch(/GraphiQL/)
  })

  it('succeeds introspection query', async () => {
    require('../src/index.ts')

    const response = await self.trigger(
      'fetch',
      new Request('/graphql', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: getIntrospectionQuery(),
        }),
      }),
    )
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
    require('../src/index.ts')

    const response = await self.trigger(
      'fetch',
      new Request('/graphql', {
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
    )
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/event-stream')
    const responseBodyReader = response.body.getReader()
    const { value, done } = await responseBodyReader.read()
    expect(done).toBe(false)
    expect(value.toString()).toMatch(/data: {/)
    responseBodyReader.releaseLock()
  })
})
