import { getIntrospectionQuery, IntrospectionQuery } from 'graphql'
import { GraphQLServer } from 'graphql-yoga'
import { AddressInfo } from 'net'
import EventSource from 'eventsource'
import request from 'supertest'
import { schema } from '../test-utils/schema'

const yoga = new GraphQLServer({ schema, enableLogging: false })

describe('Requests', () => {
  it('should send introspection query', async () => {
    const { response, executionResult } = await yoga.inject<IntrospectionQuery>(
      {
        document: getIntrospectionQuery(),
      },
    )

    expect(response.statusCode).toBe(200)
    expect(executionResult.errors).toBeUndefined()
    expect(executionResult.data?.__schema.queryType.name).toBe('Query')
  })

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

describe('Uploads', () => {
  // TODO: Need to find a way to test using fastify inject
  beforeAll(async () => {
    await yoga.start()
  })

  afterAll(async () => {
    await yoga.stop()
  })
  it('should upload a file', async () => {
    const UPLOAD_MUTATION = /* GraphQL */ `
      mutation upload($file: Blob!) {
        singleUpload(image: $file)
      }
    `
    const { body } = await request(yoga.server)
      .post('/graphql')
      .field(
        'operations',
        JSON.stringify({ query: UPLOAD_MUTATION, variables: { file: null } }),
      )
      .field('map', JSON.stringify({ 0: ['variables.file'] }))
      .attach('0', Buffer.from('test'), {
        filename: 'test.txt',
        contentType: 'text/plain',
      })

    expect(body.errors).toBeUndefined()
    expect(body.data.singleUpload).toBe(true)
  })

  it('should get subscription', async () => {
    const { address, port } = yoga.server.address() as AddressInfo

    const eventSource = new EventSource(
      `http://${address}:${port}/graphql?query=subscription{ping}`,
    )
    const payload = await new Promise<any>((resolve) => {
      eventSource.addEventListener('message', (event: any) => {
        resolve(event.data)
        eventSource.close()
      })
    })
    const { data } = JSON.parse(payload)

    expect(data.ping).toBe('pong')
  })
})
