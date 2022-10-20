import { fetch } from '@whatwg-node/fetch'

import { createYoga, createSchema } from 'graphql-yoga'

import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { Server } from 'bun'

describe('Bun integration', () => {
  const yoga = createYoga({
    schema: createSchema({
      typeDefs: /* GraphQL */ `
        type Query {
          greetings: String
        }
      `,
      resolvers: {
        Query: {
          greetings: () => 'Hello Bun!',
        },
      },
    }),
  })

  let server: Server
  beforeAll(() => {
    server = Bun.serve({
      fetch: yoga,
      port: 3000,
    })
  })

  afterAll(() => {
    server.stop()
  })

  it('shows GraphiQL', async () => {
    const response = await fetch(`http://127.0.0.1:3000/graphql`, {
      method: 'GET',
      headers: {
        Accept: 'text/html',
      },
    })
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/html')
    const htmlContents = await response.text()
    expect(htmlContents.includes('GraphiQL')).toBe(true)
  })

  it('accepts a query', async () => {
    const response = await fetch(`http://127.0.0.1:3000/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `{ greetings }`,
      }),
    })
    const result = await response.json()
    expect(result.data.greetings).toBe('Hello Bun!')
  })
})
