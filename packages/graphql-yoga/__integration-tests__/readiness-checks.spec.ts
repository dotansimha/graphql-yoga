import { createServer } from 'http'
import { createYoga } from 'graphql-yoga'
import { fetch } from '@whatwg-node/fetch'
import getPort from 'get-port'

// TODO: this currently requires a "true" HTTP request :thinking:
it('return 200 status code for readiness check endpoint', async () => {
  const yoga = createYoga({
    logging: false,
    maskedErrors: false,
  })
  const server = createServer(yoga)

  try {
    const port = await getPort()
    await new Promise<void>((resolve) => server.listen(port, resolve))
    // TODO: if this uses localhost the thing fails because fetchAPI.fetch implemented in useHealthCheck cannot resolve it (0.0.0.1).
    const result = await fetch(`http://127.0.0.1:${port}/readiness`, {
      method: 'GET',
    })
    expect(result.status).toBe(200)
    expect(await result.json()).toEqual({ message: 'ready' })
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
})
