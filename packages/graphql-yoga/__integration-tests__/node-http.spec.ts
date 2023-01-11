import { createServer, IncomingMessage, Server, ServerResponse } from 'node:http'
import { AddressInfo } from 'node:net'

import { fetch } from '@whatwg-node/fetch'

import { createSchema, createYoga } from '../src/index.js'

it('should expose Node req and res objects in the context', async () => {
  let server: Server
  try {
    const yoga = createYoga<{
      req: IncomingMessage
      res: ServerResponse
    }>({
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            isNode: Boolean!
          }
        `,
        resolvers: {
          Query: {
            isNode: (_, __, { req, res }) => Boolean(req) && Boolean(res),
          },
        },
      }),
      logging: false,
    })
    server = createServer(yoga)
    await new Promise<void>(resolve => server.listen(0, resolve))
    const port = (server.address() as AddressInfo).port
    const response = await fetch(`http://localhost:${port}/graphql?query=query{isNode}`)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.errors).toBeUndefined()
    expect(body.data.isNode).toBe(true)
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()))
  }
})
