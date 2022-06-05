import worker from '../src/index'
import { Request } from 'cross-undici-fetch'
import { getIntrospectionQuery } from 'graphql'

test('should render GraphiQL', async () => {
  // Note we're using Worker APIs in our test, without importing anything extra
  const request = new Request('http://localhost/graphql', {
    method: 'GET',
    headers: {
      Accept: 'text/html',
    },
  })
  const response = await worker.fetch(request)

  expect(response.status).toBe(200)
  expect(response.headers.get('content-type')).toBe('text/html')
  expect(await response.text()).toMatch(/GraphiQL/)
})

test('should succeeds introspection query', async () => {
  // Note we're using Worker APIs in our test, without importing anything extra
  const request = new Request('http://localhost/graphql', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: getIntrospectionQuery(),
    }),
  })
  const response = await worker.fetch(request)

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
