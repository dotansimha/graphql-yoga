import { spawn } from 'child_process'
import { fetch } from '@whatwg-node/fetch'

import { createYoga, createSchema } from 'graphql-yoga'

import { describe, it, expect } from 'bun:test'

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

  const server = Bun.serve(yoga)

  it('shows GraphiQL', async () => {
    const response = await fetch(
      new URL(yoga.graphqlEndpoint, server.hostname).toString(),
      {
        method: 'GET',
        headers: {
          Accept: 'text/html',
        },
      },
    )
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/html')
    const htmlContents = await response.text()
    expect(htmlContents.includes('GraphiQL')).toBe(true)
  })

  it('accepts a query', async () => {
    const response = await fetch(
      new URL(yoga.graphqlEndpoint, server.hostname).toString(),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `{ greetings }`,
        }),
      },
    )
    const result = await response.json()
    expect(result.data.greetings).toBe('Hello Bun!')
  })

  server.stop()
})
