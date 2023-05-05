import {
  createServer,
  IncomingMessage,
  Server,
  ServerResponse,
  STATUS_CODES,
} from 'node:http'
import { AddressInfo } from 'node:net'
import { fetch } from '@whatwg-node/fetch'

import { createGraphQLError, createSchema, createYoga } from '../src/index.js'

describe('node-http', () => {
  let server: Server
  let port: number

  beforeAll(async () => {
    const yoga = createYoga<{
      req: IncomingMessage
      res: ServerResponse
    }>({
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            isNode: Boolean!
            throw(status: Int): Int!
          }
        `,
        resolvers: {
          Query: {
            isNode: (_, __, { req, res }) => Boolean(req) && Boolean(res),
            throw(_, { status }) {
              throw createGraphQLError('Test', {
                extensions: {
                  http: {
                    status,
                  },
                },
              })
            },
          },
        },
      }),
      logging: false,
    })
    server = createServer(yoga)
    await new Promise<void>((resolve) => server.listen(0, resolve))
    port = (server.address() as AddressInfo).port
  })

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()))
    }
  })

  it('should expose Node req and res objects in the context', async () => {
    const response = await fetch(
      `http://localhost:${port}/graphql?query=query{isNode}`,
    )
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.errors).toBeUndefined()
    expect(body.data.isNode).toBe(true)
  })

  it('should set status text by status code', async () => {
    for (const statusCodeStr in STATUS_CODES) {
      const status = Number(statusCodeStr)
      if (status < 200) continue
      const response = await fetch(`http://localhost:${port}/graphql`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          query: /* GraphQL */ `
            query StatusTest($status: Int!) {
              throw(status: $status)
            }
          `,
          variables: { status },
        }),
      })
      expect(response.status).toBe(status)
      expect(response.statusText).toBe(STATUS_CODES[status])
    }
  })
})
