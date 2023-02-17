import { useResponseCache } from '@graphql-yoga/plugin-response-cache'
import { createSchema, createYoga } from 'graphql-yoga'

const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type Query {
      _: String
    }
  `,
  resolvers: {
    Query: {
      _: () => 'DUMMY',
    },
  },
})

it('should not hit GraphQL pipeline if cached', async () => {
  const onEnveloped = jest.fn()
  const yoga = createYoga({
    schema,
    plugins: [
      useResponseCache({
        session: () => null,
        includeExtensionMetadata: true,
      }),
      {
        onEnveloped,
      },
    ],
  })
  const response = await yoga.fetch('http://localhost:3000/graphql', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ query: '{ _ }' }),
  })

  expect(response.status).toEqual(200)
  const body = await response.json()
  expect(body).toEqual({
    data: {
      _: 'DUMMY',
    },
    extensions: {
      responseCache: {
        didCache: true,
        hit: false,
        ttl: null,
      },
    },
  })
  const response2 = await yoga.fetch('http://localhost:3000/graphql', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ query: '{ _ }' }),
  })
  const body2 = await response2.json()
  expect(body2).toMatchObject({
    data: {
      _: 'DUMMY',
    },
    extensions: {
      responseCache: {
        hit: true,
      },
    },
  })
  expect(onEnveloped).toHaveBeenCalledTimes(1)
})

it('cache a query operation', async () => {
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
  expect(body).toMatchObject({
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
  expect(body).toMatchObject({
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
  expect(body).toMatchObject({
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
  expect(body).toMatchObject({
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
