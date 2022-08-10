import { createServer } from 'http'
import { createYoga } from 'graphql-yoga'
import { fetch } from '@whatwg-node/fetch'
import getPort from 'get-port'

// TODO: this currently requires a "true" HTTP request :thinking:
it('return 200 status code for readiness check endpoint', async () => {
  const yoga = createYoga({
    logging: false,
  })
  const server = createServer(yoga)

  try {
    const port = await getPort()
    await new Promise<void>((resolve) => server.listen(port, resolve))
    const result = await fetch(`http://localhost:${port}/readiness`, {
      method: 'GET',
    })
    expect(result.status).toBe(200)
    expect(await result.json()).toEqual({ message: 'ready' })
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
})
