import { yoga } from '../src/yoga'
import request from 'supertest'

describe('node-ts example integration', () => {
  it('should execute query', async () => {
    const response = await request(yoga)
      .post('/graphql')
      .send({ query: '{ hello }' })

    expect(response.statusCode).toBe(200)
    expect(response.body).toMatchInlineSnapshot(`
      {
        "data": {
          "hello": "world",
        },
      }
    `)
  })
})
