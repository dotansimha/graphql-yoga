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
    expect(response.status).toBe(200)
    const body = JSON.parse(await response.text())
    expect(body.data.greetings).toBe('Hello world!')
  })
})
