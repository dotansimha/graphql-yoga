import { getIntrospectionQuery, IntrospectionQuery } from 'graphql'
import { GraphQLServer } from 'graphql-yoga'
import request from 'supertest'
import { schema } from '../test-utils/schema'

const yoga = new GraphQLServer({ schema, enableLogging: false })

describe('Requests', () => {
  it('should send introspection query', async () => {
    const response = await yoga.inject<IntrospectionQuery>({
      document: getIntrospectionQuery(),
    })

    expect(response.status).toBe(200)

    const responseBody = await response.json()

    expect(responseBody.errors).toBeUndefined()
    expect(responseBody.data.__schema.queryType.name).toBe('Query')
  })

  it('should send basic query', async () => {
    const response = await yoga.inject({
      document: /* GraphQL */ `
        query {
          ping
        }
      `,
    })

    expect(response.status).toBe(200)

    const responseBody = await response.json()

    expect(responseBody.data.ping).toBe('pong')
  })

  it('should send basic mutation', async () => {
    const response = await yoga.inject({
      document: /* GraphQL */ `
        mutation {
          echo(message: "hello")
        }
      `,
    })

    const responseBody = await response.json()

    expect(responseBody.errors).toBeUndefined()
    expect(responseBody.data.echo).toBe('hello')
  })

  it('should send variables', async () => {
    const response = await yoga.inject({
      document: /* GraphQL */ `
        mutation ($text: String) {
          echo(message: $text)
        }
      `,
      variables: {
        text: 'hello',
      },
    })

    expect(response.status).toBe(200)

    const responseBody = await response.json()

    expect(responseBody.errors).toBeUndefined()
    expect(responseBody.data.echo).toBe('hello')
  })

  it('should error on malformed query', async () => {
    const response = await yoga.inject({
      document: '{ query { ping }',
    })

    const responseBody = await response.json()
    expect(responseBody.errors).toBeDefined()
    expect(responseBody.data).toBeUndefined()
  })

  it('should error missing query', async () => {
    // @ts-expect-error
    const response = await yoga.inject({ query: null })

    const responseBody = await response.json()
    expect(responseBody.data).toBeUndefined()
    expect(responseBody.errors[0].message).toBe('Must provide query string.')
  })
})

describe('Uploads', () => {
  const fastify = yoga.fastify

  // TODO: Need to find a way to test using fastify inject
  beforeAll(async () => {
    await fastify.ready()
  })

  afterAll(async () => {
    await fastify.close()
  })
  it('should upload a file', async () => {
    const UPLOAD_MUTATION = /* GraphQL */ `
      mutation upload($file: Blob!) {
        singleUpload(image: $file)
      }
    `
    const { body } = await request(fastify.server)
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
})
