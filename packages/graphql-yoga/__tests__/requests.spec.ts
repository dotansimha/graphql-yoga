import { createYoga, createSchema } from 'graphql-yoga'

describe('requests', () => {
  const schema = createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        ping: String
      }
      type Mutation {
        echo(str: String): String
      }
    `,
    resolvers: {
      Query: {
        ping: () => 'pong',
      },
      Mutation: {
        echo(root, args) {
          return args.str
        },
      },
    },
  })
  const endpoint = '/test-graphql'
  const yoga = createYoga({
    schema,
    logging: false,
    graphqlEndpoint: endpoint,
  })

  it('should reject other paths if specific endpoint path is provided', async () => {
    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'GET',
    })
    expect(response.status).toBe(404)
  })

  it('should send basic query', async () => {
    const response = await yoga.fetch('http://yoga/test-graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ ping }' }),
    })

    expect(response.status).toBe(200)
    const body = JSON.parse(await response.text())
    expect(body.errors).toBeUndefined()
    expect(body.data.ping).toBe('pong')
  })

  it('should send basic query with GET', async () => {
    const response = await yoga.fetch(
      `http://yoga/test-graphql?query=${encodeURIComponent('{ ping }')}`,
      {
        method: 'GET',
      },
    )

    expect(response.status).toBe(200)
    const body = JSON.parse(await response.text())
    expect(body.errors).toBeUndefined()
    expect(body.data.ping).toBe('pong')
  })

  it('sending mutation over GET method is prohibited', async () => {
    const response = await yoga.fetch(
      `http://yoga/test-graphql?query=${encodeURIComponent(
        'mutation { __typename }',
      )}`,
      {
        method: 'GET',
      },
    )

    expect(response.status).toBe(405)

    expect(response.headers.get('allow')).toEqual('POST')
    const body = JSON.parse(await response.text())

    expect(body.data).not.toBeDefined()
    expect(body.errors).toHaveLength(1)
    expect(body.errors[0].message).toEqual('Cannot perform mutations over GET')
  })

  it('should send basic mutation', async () => {
    const response = await yoga.fetch(`http://yoga/test-graphql`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: /* GraphQL */ `
          mutation {
            echo
          }
        `,
      }),
    })

    expect(response.status).toBe(200)
    const body = JSON.parse(await response.text())
    expect(body.errors).toBeUndefined()
    expect(body.data.echo).toBe(null)
  })

  it('should send variables', async () => {
    const response = await yoga.fetch(`http://yoga/test-graphql`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: /* GraphQL */ `
          mutation Foo($text: String!) {
            echo(str: $text)
          }
        `,
        variables: { text: 'hello' },
      }),
    })

    expect(response.status).toBe(200)
    const body = JSON.parse(await response.text())
    expect(body.errors).toBeUndefined()
    expect(body.data.echo).toBe('hello')
  })

  it('should error on malformed JSON parameters', async () => {
    const response = await yoga.fetch(`http://yoga/test-graphql`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{ "query": "{ ping }"',
    })
    expect(response.status).toBe(400)

    const body = JSON.parse(await response.text())

    expect(body.errors).toBeDefined()
    expect(body.data).not.toBeDefined()
  })

  it('should error on invalid JSON parameters', async () => {
    const response = await yoga.fetch(`http://yoga/test-graphql`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'null',
    })
    expect(response.status).toBe(400)

    const body = JSON.parse(await response.text())
    expect(body.errors).toBeDefined()
    expect(body.errors[0].message).toEqual('Unparsable JSON body')

    expect(body.data).not.toBeDefined()
  })

  it('should error on malformed query string', async () => {
    const response = await yoga.fetch(`http://yoga/test-graphql`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ query { ping }' }),
    })

    expect(response.status).toBe(400)

    const body = JSON.parse(await response.text())

    expect(body.errors).toBeDefined()
    expect(body.data).not.toBeDefined()
  })

  it('should error missing query', async () => {
    const response = await yoga.fetch(`http://yoga/test-graphql`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: null }),
    })

    expect(response.status).toBe(400)

    const body = JSON.parse(await response.text())
    expect(body.data).not.toBeDefined()
    expect(body.errors?.[0].message).toBe('Missing query')
  })

  it('should error if query is not a string', async () => {
    const response = await yoga.fetch(`http://yoga/test-graphql`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: { ping: 'pong' } }),
    })

    expect(response.status).toBe(400)

    const body = JSON.parse(await response.text())
    expect(body.data).not.toBeDefined()
    expect(body.errors?.[0].message).toBe('Invalid query')
  })

  it('should handle preflight requests correctly', async () => {
    const response = await yoga.fetch(`http://yoga/test-graphql`, {
      method: 'OPTIONS',
      headers: {
        'content-type': 'application/json',
        'access-control-request-method': 'POST',
        origin: 'http://localhost:3000',
      },
    })

    expect(response.status).toEqual(204)
    expect(response.headers.get('access-control-allow-origin')).toEqual(
      'http://localhost:3000',
    )
    expect(response.headers.get('access-control-allow-methods')).toEqual('POST')
  })

  it('should handle POST requests with a GraphQL operation string', async () => {
    const response = await yoga.fetch(`http://yoga/test-graphql`, {
      method: 'POST',
      headers: {
        'content-type': 'application/graphql',
      },
      body: '{ping}',
    })

    expect(response.status).toBe(200)
    const body = JSON.parse(await response.text())
    expect(body.errors).toBeUndefined()
    expect(body.data.ping).toBe('pong')
  })

  it('should handle POST requests with url encoded string', async () => {
    const response = await yoga.fetch(`http://yoga/test-graphql`, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: `query=${encodeURIComponent('{ ping }')}`,
    })

    expect(response.status).toBe(200)
    const body = JSON.parse(await response.text())
    expect(body.errors).toBeUndefined()
    expect(body.data.ping).toBe('pong')
  })
})
