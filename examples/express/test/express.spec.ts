import { buildApp } from '../src/app'
import request from 'supertest'

describe('express', () => {
  const app = buildApp()
  it('should show GraphiQL', async () => {
    const response = await request(app)
      .get('/graphql')
      .set('Accept', 'text/html')
    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
  })
  it('should handle POST requests', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({ query: '{ hello }' })
    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('application/json')
    expect(response.body).toStrictEqual({
      data: {
        hello: 'world',
      },
    })
  })
})
