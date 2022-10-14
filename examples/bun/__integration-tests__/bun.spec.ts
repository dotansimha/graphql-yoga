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

  it('shows GraphiQL', async () => {
    const server = Bun.serve(yoga)
    const response = await fetch(
      new URL(
        yoga.graphqlEndpoint,
        `http://${server.hostname}:${server.port}`,
      ).toString(),
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
    server.stop()
  })

  // TODO: SegmentationFault at 0x0500000000000000
  // it('accepts a query', async () => {
  //   const server = Bun.serve(yoga)
  //   const response = await fetch(
  //     new URL(
  //       yoga.graphqlEndpoint,
  //       `http://${server.hostname}:${server.port}`,
  //     ).toString(),
  //     {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         query: `{ greetings }`,
  //       }),
  //     },
  //   )
  //   const result = await response.json()
  //   expect(result.data.greetings).toBe('Hello Bun!')
  //   server.stop()
  // })
})
