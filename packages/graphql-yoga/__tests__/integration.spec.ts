import { getIntrospectionQuery, IntrospectionQuery } from 'graphql'
import { createServer, GraphQLYogaError } from 'graphql-yoga'
import { AddressInfo } from 'net'
import EventSource from 'eventsource'
import request from 'supertest'
import { getCounterValue, schema } from '../test-utils/schema'

const yoga = createServer({ schema, enableLogging: false })

describe('Introspection Option', () => {
  it('should succeed introspection query', async () => {
    const { response, executionResult } = await yoga.inject<IntrospectionQuery>(
      {
        document: getIntrospectionQuery(),
      },
    )

    expect(response.statusCode).toBe(200)
    expect(executionResult.errors).toBeUndefined()
    expect(executionResult.data?.__schema.queryType.name).toBe('Query')
  })

  it('should fail introspection query', async () => {
    const server = createServer({
      schema,
      enableLogging: false,
      introspection: false,
    })
    const { response, executionResult } =
      await server.inject<IntrospectionQuery>({
        document: getIntrospectionQuery(),
      })

    expect(response.statusCode).toBe(400)
    expect(executionResult.data).toBeUndefined()
    expect(executionResult.errors![0].name).toBe('GraphQLError')
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

  it('should mask error', async () => {
    const server = createServer({
      typeDefs,
      resolvers,
      maskedErrors: true,
      enableLogging: false,
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
      typeDefs,
      resolvers,
      maskedErrors: { errorMessage: 'Hahahaha' },
      enableLogging: false,
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

  it('should not mask errors by default', async () => {
    const server = createServer({
      typeDefs,
      resolvers,
      enableLogging: false,
    })

    const { executionResult } = await server.inject({
      document: '{ hi hello }',
    })

    expect(executionResult.data.hi).toBeNull()
    expect(executionResult.errors![0].message).toBe(
      'This error will get mask if you enable maskedError.',
    )
    expect(executionResult.data.hello).toBeNull()
    expect(executionResult.errors![1].message).toBe(
      'This error never gets masked.',
    )
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

  it('should pass IncomingMessage object from Node to the context', async () => {
    const { executionResult } = await yoga.inject({
      document: '{ isNode }',
    })

    expect(executionResult.errors).toBeUndefined()
    expect(executionResult.data.isNode).toBe(true)
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
        singleUpload(file: $file)
      }
    `

    const fileContent = 'Hello World'

    const { body } = await request(yoga.server)
      .post('/graphql')
      .field(
        'operations',
        JSON.stringify({ query: UPLOAD_MUTATION, variables: { file: null } }),
      )
      .field('map', JSON.stringify({ 0: ['variables.file'] }))
      .attach('0', Buffer.from(fileContent), {
        filename: 'test.txt',
        contentType: 'text/plain',
      })

    expect(body.errors).toBeUndefined()
    expect(body.data.singleUpload).toBe(fileContent)
  })

  it('should get subscription', async () => {
    const { address, port } = yoga.server.address() as AddressInfo

    const eventSource = new EventSource(
      `http://${address}:${port}/graphql?query=subscription{counter}`,
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
