import { useResponseCache } from '@graphql-yoga/plugin-response-cache'
import { createSchema, createYoga } from 'graphql-yoga'

describe('response cache', () => {
  it('cache a query operation', async () => {
    const schema = createSchema({
      typeDefs: /* GraphQL */ `
        type Query {
          _: String
        }
      `,
    })

    const yoga = createYoga({
      plugins: [
        useResponseCache({
          session: () => null,
          includeExtensionMetadata: true,
        }),
      ],
      schema,
    })
    function fetch() {
      return yoga.fetch('http://localhost:3000/graphql', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ query: '{__typename}' }),
      })
    }

    let response = await fetch()

    expect(response.status).toEqual(200)
    let body = await response.json()
    expect(body).toEqual({
      data: {
        __typename: 'Query',
      },
      extensions: {
        responseCache: {
          didCache: true,
          hit: false,
          ttl: null,
        },
      },
    })

    response = await fetch()
    expect(response.status).toEqual(200)
    body = await response.json()
    expect(body).toEqual({
      data: {
        __typename: 'Query',
      },
      extensions: {
        responseCache: {
          hit: true,
        },
      },
    })
  })

  it('cache a query operation per session', async () => {
    const schema = createSchema({
      typeDefs: /* GraphQL */ `
        type Query {
          _: String
        }
      `,
    })

    const yoga = createYoga({
      plugins: [
        useResponseCache({
          session: (request) => request.headers.get('x-session-id') ?? null,
          includeExtensionMetadata: true,
        }),
      ],
      schema,
    })
    function fetch(sessionId: string) {
      return yoga.fetch('http://localhost:3000/graphql', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({ query: '{__typename}' }),
      })
    }

    let response = await fetch('1')

    expect(response.status).toEqual(200)
    let body = await response.json()
    expect(body).toEqual({
      data: {
        __typename: 'Query',
      },
      extensions: {
        responseCache: {
          didCache: true,
          hit: false,
          ttl: null,
        },
      },
    })

    response = await fetch('1')
    expect(response.status).toEqual(200)
    body = await response.json()
    expect(body).toEqual({
      data: {
        __typename: 'Query',
      },
      extensions: {
        responseCache: {
          hit: true,
        },
      },
    })

    response = await fetch('2')

    expect(response.status).toEqual(200)
    body = await response.json()
    expect(body).toEqual({
      data: {
        __typename: 'Query',
      },
      extensions: {
        responseCache: {
          didCache: true,
          hit: false,
          ttl: null,
        },
      },
    })
  })

  it('does not mix the cache of different schemas', async () => {
    const firstSchema = createSchema({
      typeDefs: /* GraphQL */ `
        type Query {
          hi: String!
        }
      `,
      resolvers: {
        Query: {
          hi: () => 'Hello',
        },
      },
    })

    const secondSchema = createSchema({
      typeDefs: /* GraphQL */ `
        type Query {
          hi: String!
        }
      `,
      resolvers: {
        Query: {
          hi: () => 'Ola',
        },
      },
    })

    let currentSchema = firstSchema

    const yoga = createYoga({
      schema: () => currentSchema,
      plugins: [
        useResponseCache({
          session: () => null,
        }),
      ],
    })

    let response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{ hi }' }),
    })

    expect(response.status).toEqual(200)
    expect(await response.json()).toEqual({ data: { hi: 'Hello' } })

    currentSchema = secondSchema

    response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{ hi }' }),
    })

    expect(response.status).toEqual(200)
    expect(await response.json()).toEqual({ data: { hi: 'Ola' } })
  })
})
