import { getIntrospectionQuery, IntrospectionQuery } from 'graphql'
import { createServer, GraphQLYogaError } from '../src'
import { useDisableIntrospection } from '@envelop/disable-introspection'
import EventSource from 'eventsource'
import request from 'supertest'
import { getCounterValue, schema } from '../test-utils/schema'

const yoga = createServer({ schema, logging: false })

describe('Disable Introspection with plugin', () => {
  it('succeeds introspection query', async () => {
    const { response, executionResult } = await yoga.inject<IntrospectionQuery>(
      {
        document: getIntrospectionQuery(),
      },
    )

    expect(response.statusCode).toBe(200)
    expect(executionResult.errors).toBeUndefined()
    expect(executionResult.data?.__schema.queryType.name).toBe('Query')
  })

  it('fails introspection query with useDisableIntrospection', async () => {
    const server = createServer({
      schema,
      logging: false,
      // @ts-ignore
      plugins: [useDisableIntrospection()],
    })
    const { response, executionResult } =
      await server.inject<IntrospectionQuery>({
        document: getIntrospectionQuery(),
      })

    expect(response.statusCode).toBe(400)
    expect(executionResult.data).toBeUndefined()
    expect(executionResult.errors![0]).toMatchInlineSnapshot(`
      Object {
        "locations": Array [
          Object {
            "column": 7,
            "line": 3,
          },
        ],
        "message": "GraphQL introspection has been disabled, but the requested query contained the field \\"__schema\\".",
      }
    `)
  })
})

describe('Masked Error Option', () => {
  const typeDefs = /* GraphQL */ `
    type Query {
      hello: String
      hi: String
    }
  `

  const resolvers = {
    Query: {
      hello: () => {
        throw new GraphQLYogaError('This error never gets masked.')
      },
      hi: () => {
        throw new Error('This error will get mask if you enable maskedError.')
      },
    },
  }

  const schema = {
    typeDefs,
    resolvers,
  }

  const initialEnv = process.env.NODE_ENV

  afterEach(() => {
    process.env.NODE_ENV = initialEnv
  })

  it('should mask error', async () => {
    const server = createServer({
      schema,
      maskedErrors: true,
      logging: false,
    })

    const { executionResult } = await server.inject({
      document: '{ hi hello }',
    })

    expect(executionResult.data.hi).toBeNull()
    expect(executionResult.errors![0].message).toBe('Unexpected error.')
    expect(executionResult.data.hello).toBeNull()
    expect(executionResult.errors![1].message).toBe(
      'This error never gets masked.',
    )
  })

  it('should mask error with custom message', async () => {
    const server = createServer({
      schema,
      maskedErrors: { errorMessage: 'Hahahaha' },
      logging: false,
    })

    const { executionResult } = await server.inject({
      document: '{ hello hi }',
    })

    expect(executionResult.data.hello).toBeNull()
    expect(executionResult.errors![0].message).toBe(
      'This error never gets masked.',
    )
    expect(executionResult.data.hi).toBeNull()
    expect(executionResult.errors![1].message).toBe('Hahahaha')
  })

  it('should mask errors by default', async () => {
    const server = createServer({
      schema,
      logging: false,
    })

    const { executionResult } = await server.inject({
      document: '{ hi hello }',
    })

    expect(executionResult.data.hi).toBeNull()
    expect(executionResult.errors![0].message).toBe('Unexpected error.')
    expect(executionResult.data.hello).toBeNull()
    expect(executionResult.errors![1].message).toBe(
      'This error never gets masked.',
    )
  })

  it('includes the original error in the extensions in dev mode (isDev flag)', async () => {
    const server = createServer({
      schema,
      logging: false,
      maskedErrors: {
        isDev: true,
      },
    })

    const { executionResult } = await server.inject({
      document: '{ hi }',
    })

    expect(executionResult.data.hi).toBeNull()
    expect(executionResult.errors?.[0]?.message).toBe('Unexpected error.')
    expect(executionResult.errors?.[0]?.extensions).toStrictEqual({
      originalError: {
        message: 'This error will get mask if you enable maskedError.',
        stack: expect.stringContaining(
          'Error: This error will get mask if you enable maskedError.',
        ),
      },
    })
  })
  it('includes the original error in the extensions in dev mode (NODE_ENV=development)', async () => {
    process.env.NODE_ENV = 'development'
    const server = createServer({
      schema,
      logging: false,
    })

    const { executionResult } = await server.inject({
      document: '{ hi }',
    })

    expect(executionResult.data.hi).toBeNull()
    expect(executionResult.errors?.[0]?.message).toBe('Unexpected error.')
    expect(executionResult.errors?.[0]?.extensions).toStrictEqual({
      originalError: {
        message: 'This error will get mask if you enable maskedError.',
        stack: expect.stringContaining(
          'Error: This error will get mask if you enable maskedError.',
        ),
      },
    })
  })
})

describe('Context error', () => {
  it('Error thrown within context factory without error masking is not swallowed and does not include stack trace', async () => {
    const server = createServer({
      logging: false,
      maskedErrors: false,
      context: () => {
        throw new Error('I like turtles')
      },
    })

    const { executionResult } = await server.inject({
      document: '{ greetings }',
    })
    expect(executionResult).toMatchInlineSnapshot(`
      Object {
        "errors": Array [
          Object {
            "message": "I like turtles",
          },
        ],
      }
    `)
  })

  it('Error thrown within context factory with error masking is masked', async () => {
    const server = createServer({
      logging: false,
      context: () => {
        throw new Error('I like turtles')
      },
    })

    const { executionResult } = await server.inject({
      document: '{ greetings }',
    })
    expect(executionResult).toMatchInlineSnapshot(`
      Object {
        "errors": Array [
          Object {
            "message": "Unexpected error.",
          },
        ],
      }
    `)
  })

  it('GraphQLYogaError thrown within context factory with error masking is not masked', async () => {
    const server = createServer({
      logging: false,
      context: () => {
        throw new GraphQLYogaError('I like turtles')
      },
    })

    const { executionResult } = await server.inject({
      document: '{ greetings }',
    })
    expect(executionResult).toMatchInlineSnapshot(`
      Object {
        "errors": Array [
          Object {
            "message": "I like turtles",
          },
        ],
      }
    `)
  })
})

describe('Requests', () => {
  it('should send basic query', async () => {
    const { response, executionResult } = await yoga.inject({
      document: /* GraphQL */ `
        query {
          ping
        }
      `,
    })

    expect(response.statusCode).toBe(200)
    expect(executionResult.errors).toBeUndefined()
    expect(executionResult.data.ping).toBe('pong')
  })

  it('should send basic mutation', async () => {
    const { response, executionResult } = await yoga.inject({
      document: /* GraphQL */ `
        mutation {
          echo(message: "hello")
        }
      `,
    })

    expect(response.statusCode).toBe(200)
    expect(executionResult.errors).toBeUndefined()
    expect(executionResult.data.echo).toBe('hello')
  })

  it('should send variables', async () => {
    const { response, executionResult } = await yoga.inject({
      document: /* GraphQL */ `
        mutation ($text: String) {
          echo(message: $text)
        }
      `,
      variables: {
        text: 'hello',
      },
    })

    expect(response.statusCode).toBe(200)
    expect(executionResult.errors).toBeUndefined()
    expect(executionResult.data.echo).toBe('hello')
  })

  it('should error on malformed query', async () => {
    const { executionResult } = await yoga.inject({
      document: '{ query { ping }',
    })

    expect(executionResult.errors).toBeDefined()
    expect(executionResult.data).toBeUndefined()
  })

  it('should error missing query', async () => {
    const { executionResult } = await yoga.inject({ document: null } as any)

    expect(executionResult.data).toBeUndefined()
    expect(executionResult.errors?.[0].message).toBe(
      'Must provide query string.',
    )
  })
})

describe('Incremental Delivery', () => {
  // TODO: Need to find a way to test using fastify inject
  beforeAll(async () => {
    await yoga.start()
  })

  afterAll(async () => {
    await yoga.stop()
  })
  it('should upload a file', async () => {
    const UPLOAD_MUTATION = /* GraphQL */ `
      mutation upload($file: Upload!) {
        singleUpload(file: $file) {
          name
          type
          text
        }
      }
    `

    const fileName = 'test.txt'
    const fileType = 'text/plain'
    const fileContent = 'Hello World'

    const nodeServer = yoga.getNodeServer()

    const { body } = await request(nodeServer)
      .post('/graphql')
      .field(
        'operations',
        JSON.stringify({ query: UPLOAD_MUTATION, variables: { file: null } }),
      )
      .field('map', JSON.stringify({ 0: ['variables.file'] }))
      .attach('0', Buffer.from(fileContent), {
        filename: fileName,
        contentType: fileType,
      })

    expect(body.errors).toBeUndefined()
    expect(body.data.singleUpload.name).toBe(fileName)
    expect(body.data.singleUpload.type).toBe(fileType)
    expect(body.data.singleUpload.text).toBe(fileContent)
  })

  it('should get subscription', async () => {
    const { protocol, hostname, port, endpoint } = yoga.getAddressInfo()

    const eventSource = new EventSource(
      `${protocol}://${hostname}:${port}/${endpoint}?query=subscription{counter}`,
    )

    const counterValue1 = getCounterValue()

    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(getCounterValue() > counterValue1).toBe(true)

    eventSource.close()

    await new Promise((resolve) => setTimeout(resolve, 300))

    const counterValue2 = getCounterValue()

    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(getCounterValue()).toBe(counterValue2)
  })
})
