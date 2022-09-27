import { createServer, Server } from 'http'
import { AddressInfo } from 'net'
import { fetch } from '@whatwg-node/fetch'
import { createYoga } from 'graphql-yoga'
import { schema } from '../src/schema'
import { GraphQLContext } from '../src/context'
import { mockDeep } from 'jest-mock-extended'
import { PrismaClient } from '@prisma/client'

const createMockContext = (): GraphQLContext => {
  return {
    prisma: mockDeep<PrismaClient>(),
  }
}

describe('hackernews example integration', () => {
  let server: Server
  let port: number
  let mockCtx: GraphQLContext

  beforeAll(async () => {
    mockCtx = createMockContext()
    const yoga = createYoga({
      schema,
      context: createMockContext,
      maskedErrors: false,
    })
    server = createServer(yoga)
    await new Promise<void>((resolve) => server.listen(0, resolve))
    port = (server.address() as AddressInfo).port
  })

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve))
  })

  it('should execute query', async () => {
    const response = await fetch(
      `http://localhost:${port}/graphql?query=query{hello}`,
    )
    const body = await response.json()
    expect(body.errors).toBeUndefined()
    expect(body.data).toEqual({
      hello: 'Hello World!',
    })
  })

  it('should create a post', async () => {
    mockCtx.prisma.link.create.mockResolvedValue({
      url: 'https://www.prisma.io',
      description: 'Prisma replaces traditional ORMs',
    })
    const response = await fetch(`http://localhost:${port}/graphql`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: /* GraphQL */ `
          mutation createPost {
            postLink(
              url: "https://www.prisma.io"
              description: "Prisma replaces traditional ORMs"
            ) {
              url
            }
          }
        `,
      }),
    })

    const body = await response.json()
    expect(body.errors).toBeUndefined()
    expect(body.data).toEqual({
      url: 'https://www.prisma.io',
    })
  })
})
