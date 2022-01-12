import 'reflect-metadata'
import { buildApp } from '../src/app'

describe('fastify-modules', () => {
  const app = buildApp()
  it('should show GraphiQL', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/graphql',
      headers: {
        accept: 'text/html',
      },
    })
    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
  })
  it('should handle POST requests', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/graphql',
      payload: {
        query: '{ hello }',
      },
    })
    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('application/json')
    expect(response.body).toStrictEqual(
      JSON.stringify({
        data: {
          hello: 'world',
        },
      }),
    )
  })
  it('should handle context request', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/graphql',
      payload: {
        query: '{ request }',
      },
    })
    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('application/json')
    expect(response.body).toContain('req')
  })
})
