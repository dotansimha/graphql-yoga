import { yoga } from '../yoga.mjs'

describe('Node ESM', () => {
  it('should work', async () => {
    const response = await yoga.fetch('https://yoga/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        query: '{ greetings }',
      }),
    })
    const body = await response.json()
    expect(body).toBe({
      data: {
        greetings: 'Hello world!',
      },
    })
    expect(response.status).toBe(200)
  })
})
