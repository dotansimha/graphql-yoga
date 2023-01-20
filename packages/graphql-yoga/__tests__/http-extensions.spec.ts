import { ExecutionResult, GraphQLObjectType, GraphQLScalarType } from 'graphql'
import { createGraphQLError, createSchema, createYoga } from '../src/index.js'

describe('GraphQLError.extensions.http', () => {
  it('sets correct status code and headers for thrown GraphQLError in a resolver', async () => {
    const yoga = createYoga({
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            a: String
          }
        `,
        resolvers: {
          Query: {
            a() {
              throw createGraphQLError('A', {
                extensions: {
                  http: {
                    status: 401,
                    headers: {
                      'www-authenticate': 'Bearer',
                    },
                  },
                },
              })
            },
          },
        },
      }),
      logging: false,
    })

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{ a }' }),
    })

    expect(response.status).toBe(401)
    expect(response.headers.get('www-authenticate')).toBe('Bearer')
  })

  it('picks the highest status code and headers for GraphQLErrors thrown within multiple resolvers', async () => {
    const yoga = createYoga({
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            a: String
            b: String
          }
        `,
        resolvers: {
          Query: {
            a: () => {
              throw createGraphQLError('A', {
                extensions: {
                  http: {
                    status: 401,
                  },
                },
              })
            },
            b: () => {
              throw createGraphQLError('B', {
                extensions: {
                  http: {
                    status: 503,
                  },
                },
              })
            },
          },
        },
      }),
    })

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{ a b }' }),
    })

    expect(response.status).toBe(503)

    const body = await response.json()
    expect(body).toMatchObject({
      data: {
        a: null,
        b: null,
      },
      errors: [
        {
          message: 'A',
          path: ['a'],
        },
        {
          message: 'B',
          path: ['b'],
        },
      ],
    })
  })

  it('picks the header of the last GraphQLError when multiple errors are thrown within multiple resolvers', async () => {
    const yoga = createYoga({
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            a: String
            b: String
          }
        `,
        resolvers: {
          Query: {
            a: () => {
              throw createGraphQLError('', {
                extensions: {
                  http: {
                    headers: {
                      'x-foo': 'A',
                    },
                  },
                },
              })
            },
            b: () => {
              throw createGraphQLError('DB is not available', {
                extensions: {
                  http: {
                    headers: {
                      'x-foo': 'B',
                    },
                  },
                },
              })
            },
          },
        },
      }),
    })

    let response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ a b }' }),
    })

    expect(response.headers.get('x-foo')).toBe('B')

    response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ b a }' }),
    })

    expect(response.headers.get('x-foo')).toBe('A')
  })

  it('should not contain the http extensions in response result', async () => {
    const yoga = createYoga({
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            a: String
          }
        `,
        resolvers: {
          Query: {
            a: () => {
              throw createGraphQLError('Woah!', {
                extensions: {
                  http: {
                    status: 418,
                    headers: {
                      'x-foo': 'A',
                    },
                  },
                },
              })
            },
          },
        },
      }),
    })

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        accept: 'application/graphql-response+json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{ a }' }),
    })
    expect(response.status).toBe(418)
    expect(response.headers.get('x-foo')).toBe('A')

    const result = await response.json()
    expect(result.errors[0]?.extensions?.http).toBeUndefined()
  })

  it('should respect http extensions status consistently on parsing fail', async () => {
    const yoga = createYoga({
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            _: String
          }
        `,
      }),
    })

    let response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        accept: 'application/json', // default
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{' }), // will throw a GraphQLError with { http: { status: 400 } }
    })
    expect(response.status).toBe(200)

    response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        accept: 'application/graphql-response+json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{' }), // will throw a GraphQLError with { http: { status: 400 } }
    })
    expect(response.status).toBe(400)
  })

  it('should respect http extensions status consistently on validation fail', async () => {
    const yoga = createYoga({
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            _: String
          }
        `,
      }),
    })

    let response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        accept: 'application/json', // default
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{ notme }' }), // will throw a GraphQLError with { http: { status: 400 } }
    })
    expect(response.status).toBe(200)

    response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        accept: 'application/graphql-response+json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{ notme }' }), // will throw a GraphQLError with { http: { status: 400 } }
    })
    expect(response.status).toBe(400)
  })

  it('should not change status code when error without http extension is thrown', async () => {
    const yoga = createYoga({
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            _: String
          }
        `,
      }),
      context: () => {
        throw createGraphQLError('No http status extension', {
          extensions: { http: { headers: { 'x-foo': 'bar' } } },
        })
      },
    })

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        accept: 'application/json', // default
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{ __typename }' }),
    })
    expect(response.status).toBe(200)
    expect(response.headers.get('x-foo')).toBe('bar')
    expect(await response.json()).toMatchObject({
      errors: [
        {
          message: 'No http status extension',
        },
      ],
    })
  })

  it('should manipulate only the extensions in response errors', async () => {
    const extensions = {
      arr: ['1', 2, null],
      obj: {
        hi: 'there',
        num: 7,
        ne: {
          st: 'ed',
          extensions: [
            {
              ext: 1,
            },
            {
              ext: '2',
            },
          ],
        },
        extensions: null,
        date: {
          extensions: new Date('2000-01-01'),
          time: new Date('2000-02-02').getTime(),
        },
      },
    }
    const yoga = createYoga({
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          scalar JSON
          type Query {
            extensions: BadExt
          }
          type BadExt {
            http: String
            unexpected: String
            extensions: JSON
          }
        `,
        resolvers: {
          JSON: new GraphQLScalarType({
            name: 'JSON',
          }),
          Query: {
            extensions: () => ({
              http: 'hey',
              unexpected: 'there',
              extensions,
            }),
          },
        },
      }),
      plugins: [
        {
          onResultProcess({ result }) {
            result = result as ExecutionResult
            result.errors = result.errors?.map((err) =>
              createGraphQLError(err.message, {
                nodes: err.nodes,
                source: err.source,
                positions: err.positions,
                path: err.path,
                originalError: err.originalError,
                extensions: {
                  ...err.extensions,
                  ...extensions,
                },
              }),
            )
            result.extensions = {
              ...result.extensions,
              extensions,
            }
          },
        },
      ],
    })

    const res = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        query: '{ extensions { http, unexpected, extensions } }',
      }),
    })

    expect(res.ok).toBeTruthy()
    await expect(res.json()).resolves.toMatchInlineSnapshot(`
      {
        "data": {
          "extensions": {
            "extensions": {
              "arr": [
                "1",
                2,
                null,
              ],
              "obj": {
                "date": {
                  "extensions": "2000-01-01T00:00:00.000Z",
                  "time": 949449600000,
                },
                "extensions": null,
                "hi": "there",
                "ne": {
                  "extensions": [
                    {
                      "ext": 1,
                    },
                    {
                      "ext": "2",
                    },
                  ],
                  "st": "ed",
                },
                "num": 7,
              },
            },
            "http": "hey",
            "unexpected": "there",
          },
        },
        "extensions": {
          "extensions": {
            "arr": [
              "1",
              2,
              null,
            ],
            "obj": {
              "date": {
                "extensions": "2000-01-01T00:00:00.000Z",
                "time": 949449600000,
              },
              "extensions": null,
              "hi": "there",
              "ne": {
                "extensions": [
                  {
                    "ext": 1,
                  },
                  {
                    "ext": "2",
                  },
                ],
                "st": "ed",
              },
              "num": 7,
            },
          },
        },
      }
    `)
  })
})
