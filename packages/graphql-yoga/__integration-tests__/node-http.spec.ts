import { IncomingMessage, ServerResponse, createServer, Server } from 'http'
import { createYoga, createSchema } from 'graphql-yoga'
import { fetch } from '@whatwg-node/fetch'

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
            isNode: (_, __, { req, res }) => !!req && !!res,
          },
        },
      }),
      logging: false,
    })
    server = createServer(yoga)
    await new Promise<void>((resolve) => server.listen(9876, resolve))
    const response = await fetch(
      'http://localhost:9876/graphql?query=query{isNode}',
    )
    expect(response.status).toBe(200)
    const body = JSON.parse(await response.text())
    expect(body.errors).toBeUndefined()
    expect(body.data.isNode).toBe(true)
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
})
