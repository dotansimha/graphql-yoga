import { GraphQLError } from 'graphql'
import { createSchema, createYoga } from 'graphql-yoga'

describe('error masking', () => {
  function createTestSchema() {
    return createSchema<any>({
      typeDefs: /* GraphQL */ `
        type Query {
          hello: String
          hi: String
        }
      `,
      resolvers: {
        Query: {
          hello: () => {
            throw new GraphQLError('This error never gets masked.')
          },
          hi: () => {
            throw new Error(
              'This error will get mask if you enable maskedError.',
            )
          },
        },
      },
    })
  }

  it('masks non GraphQLError instances', async () => {
    const yoga = createYoga({
      schema: createTestSchema(),
      maskedErrors: true,
      logging: false,
    })

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ hi hello }' }),
    })

    const body = JSON.parse(await response.text())
    expect(body.data.hi).toBeNull()
    expect(body.errors![0].message).toBe('Unexpected error.')
    expect(body.data.hello).toBeNull()
    expect(body.errors![1].message).toBe('This error never gets masked.')
  })

  it('mask error with custom message', async () => {
    const yoga = createYoga({
      schema: createTestSchema(),
      maskedErrors: { errorMessage: 'Hahahaha' },
      logging: false,
    })

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ hi hello }' }),
    })
    const body = JSON.parse(await response.text())

    expect(body.data.hi).toBeNull()
    expect(body.errors![0].message).toBe('Hahahaha')
    expect(body.data.hello).toBeNull()
    expect(body.errors![1].message).toBe('This error never gets masked.')
  })

  it('masks non GraphQLError instances by default (no config option)', async () => {
    const yoga = createYoga({
      schema: createTestSchema(),
      logging: false,
    })

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ hi hello }' }),
    })

    const body = JSON.parse(await response.text())
    expect(body.data.hi).toBeNull()
    expect(body.errors![0].message).toBe('Unexpected error.')
    expect(body.data.hello).toBeNull()
    expect(body.errors![1].message).toBe('This error never gets masked.')
  })

  it('includes the original error in the extensions in dev mode', async () => {
    const yoga = createYoga({
      schema: createTestSchema(),
      logging: false,
      maskedErrors: {
        isDev: true,
      },
    })

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ hi hello }' }),
    })

    const body = JSON.parse(await response.text())
    expect(body.data.hi).toBeNull()
    expect(body.errors?.[0]?.message).toBe('Unexpected error.')
    expect(body.errors?.[0]?.extensions).toStrictEqual({
      originalError: {
        message: 'This error will get mask if you enable maskedError.',
        stack: expect.stringContaining(
          'Error: This error will get mask if you enable maskedError.',
        ),
      },
    })
  })

  it('includes the original error in the extensions in dev mode (process.env.NODE_ENV=development)', async () => {
    const initialEnv = process.env.NODE_ENV

    try {
      process.env.NODE_ENV = 'development'

      const yoga = createYoga({
        schema: createTestSchema(),
        logging: false,
      })

      const response = await yoga.fetch('http://yoga/graphql', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: '{ hi hello }' }),
      })

      const body = JSON.parse(await response.text())
      expect(body.data.hi).toBeNull()
      expect(body.errors?.[0]?.message).toBe('Unexpected error.')
      expect(body.errors?.[0]?.extensions).toStrictEqual({
        originalError: {
          message: 'This error will get mask if you enable maskedError.',
          stack: expect.stringContaining(
            'Error: This error will get mask if you enable maskedError.',
          ),
        },
      })
    } finally {
      process.env.NODE_ENV = initialEnv
    }
  })

  it('non GraphQLError raised in onRequestParse is masked with the correct status code 500', async () => {
    const yoga = createYoga({
      schema: createTestSchema(),
      plugins: [
        {
          onRequestParse() {
            throw new Error('Some random error!')
          },
        },
      ],
      logging: false,
    })

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      body: JSON.stringify({ query: '{ hi hello }' }),
    })

    expect(response.status).toBe(500)

    const body = JSON.parse(await response.text())
    expect(body.errors?.[0]?.message).toBe('Unexpected error.')
  })

  it('error thrown within context factory without error masking is not swallowed and does not include stack trace', async () => {
    const yoga = createYoga({
      logging: false,
      maskedErrors: false,
      context: () => {
        throw new Error('I like turtles')
      },
      schema: createTestSchema(),
    })

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ __typename }' }),
    })
    const body = JSON.parse(await response.text())
    expect(body).toMatchInlineSnapshot(`
            Object {
              "data": null,
              "errors": Array [
                Object {
                  "message": "I like turtles",
                },
              ],
            }
          `)
  })

  it('error thrown within context factory is masked', async () => {
    const yoga = createYoga({
      logging: false,
      context: () => {
        throw new Error('I like turtles')
      },
      schema: createTestSchema(),
    })

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ __typename }' }),
    })
    const body = JSON.parse(await response.text())
    expect(body).toMatchInlineSnapshot(`
            Object {
              "data": null,
              "errors": Array [
                Object {
                  "message": "Unexpected error.",
                },
              ],
            }
          `)
  })

  it('GraphQLError thrown within context factory with error masking is not masked', async () => {
    const yoga = createYoga({
      logging: false,
      context: () => {
        throw new GraphQLError('I like turtles')
      },
      schema: createTestSchema(),
    })

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ __typename }' }),
    })
    const body = JSON.parse(await response.text())
    expect(body).toMatchInlineSnapshot(`
            Object {
              "data": null,
              "errors": Array [
                Object {
                  "message": "I like turtles",
                },
              ],
            }
          `)
  })

  it('GraphQLError thrown within context factory has error extensions exposed on the response', async () => {
    const yoga = createYoga({
      logging: false,
      context: () => {
        throw new GraphQLError('I like turtles', {
          extensions: {
            foo: 1,
          },
        })
      },
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            greetings: String
          }
        `,
      }),
    })

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ greetings }' }),
    })
    const body = JSON.parse(await response.text())
    expect(body).toStrictEqual({
      data: null,
      errors: [
        {
          message: 'I like turtles',
          extensions: {
            foo: 1,
          },
        },
      ],
    })
    expect(response.status).toEqual(200)
  })

  it('parse error is not masked', async () => {
    const yoga = createYoga({
      logging: false,
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            a: String!
          }
        `,
      }),
    })

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{libl_pls' }),
    })

    expect(response.status).toEqual(400)
    const body = JSON.parse(await response.text())

    expect(body).toEqual({
      data: null,
      errors: [
        {
          locations: [
            {
              column: 10,
              line: 1,
            },
          ],
          message: 'Syntax Error: Expected Name, found <EOF>.',
        },
      ],
    })
  })

  it('validation error is not masked', async () => {
    const yoga = createYoga({
      logging: false,
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            a: String!
          }
        `,
      }),
    })

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{libl_pls}' }),
    })

    expect(response.status).toEqual(400)
    const body = JSON.parse(await response.text())

    expect(body).toEqual({
      data: null,
      errors: [
        {
          locations: [
            {
              column: 2,
              line: 1,
            },
          ],

          message: 'Cannot query field "libl_pls" on type "Query".',
        },
      ],
    })
  })

  it('validation error is masked via handleValidationErrors option', async () => {
    const yoga = createYoga({
      logging: false,
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            a: String!
          }
        `,
      }),
      maskedErrors: {
        handleValidationErrors: true,
        isDev: true,
      },
    })

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{bubatzbieber}' }),
    })

    expect(response.status).toEqual(200)
    const body = JSON.parse(await response.text())

    expect(body).toMatchObject({
      data: null,
      errors: [
        {
          message: 'Unexpected error.',
        },
      ],
    })
    const { extensions } = body.errors![0]
    expect(extensions).toMatchObject({
      originalError: {
        message: 'Cannot query field "bubatzbieber" on type "Query".',
        stack: expect.stringContaining(
          'GraphQLError: Cannot query field "bubatzbieber" on type "Query"',
        ),
      },
    })
  })

  it('parse error is masked via handleParseErrors option', async () => {
    const yoga = createYoga({
      logging: false,
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            a: String!
          }
        `,
      }),
      maskedErrors: {
        handleParseErrors: true,
        isDev: true,
      },
    })

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{' }),
    })

    expect(response.status).toEqual(200)
    const body = JSON.parse(await response.text())

    expect(body).toMatchObject({
      data: null,
      errors: [
        {
          message: 'Unexpected error.',
        },
      ],
    })
    const { extensions } = body.errors![0]
    expect(extensions).toMatchObject({
      originalError: {
        message: 'Syntax Error: Expected Name, found <EOF>.',
        stack: expect.stringContaining(
          'GraphQLError: Syntax Error: Expected Name, found <EOF>.',
        ),
      },
    })
  })

  it('subclassed GraphQLError is not masked', async () => {
    class MyError extends GraphQLError {
      constructor(message: string) {
        super(message)
      }
    }

    const yoga = createYoga({
      logging: false,
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            a: String!
          }
        `,
        resolvers: {
          Query: {
            a: () => {
              throw new MyError('I like turtles')
            },
          },
        },
      }),
      maskedErrors: {
        isDev: true,
      },
    })

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{a}' }),
    })

    expect(response.status).toEqual(200)
    const body = JSON.parse(await response.text())
    expect(body).toEqual({
      data: null,
      errors: [
        {
          locations: [
            {
              column: 2,
              line: 1,
            },
          ],
          message: 'I like turtles',
          path: ['a'],
        },
      ],
    })
  })
})
