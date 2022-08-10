import { createYoga } from 'graphql-yoga'

describe('health checks', () => {
  it('return 200 status code for health check endpoint', async () => {
    const yoga = createYoga({
      logging: false,
    })
    const result = await yoga.fetch('http://yoga/health', {
      method: 'GET',
    })
    expect(result.status).toBe(200)
    expect(await result.json()).toEqual({
      message: 'alive',
    })
  })
})
