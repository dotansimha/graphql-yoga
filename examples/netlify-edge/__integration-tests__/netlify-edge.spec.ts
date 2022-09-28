import yoga from '../src'
import { createServer, Server } from 'http'
import { AddressInfo } from 'net'
import { fetch } from '@whatwg-node/fetch'

describe('netlify-edge example integration', () => {
  let server: Server
  let port: number

  beforeAll(async () => {
    server = createServer(yoga)
    await new Promise<void>((resolve) => server.listen(0, resolve))
    port = (server.address() as AddressInfo).port
  })

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve))
  })

  it('should execute query', async () => {
    const response = await fetch(
      `http://localhost:${port}/graphql?query=query{greetings}`,
    )
    const body = await response.json()
    expect(body.errors).toBeUndefined()
    expect(body.data).toMatchInlineSnapshot(`
      {
        "greetings": "This is the \`greetings\` field of the root \`Query\` type",
      }
    `)
  })
})
