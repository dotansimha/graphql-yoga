import { getIntrospectionQuery } from 'graphql'
import { GraphQLServer } from 'graphql-yoga'
import request from 'supertest'
import { schema } from '../test-utils/schema'

const yoga = new GraphQLServer({ schema, enableLogging: false, uploads: true })

describe('Requests', () => {
  it('should send introspection query', async () => {
    const response = await yoga.inject({
      document: getIntrospectionQuery(),
    })

    expect(response.statusCode).toBe(200)
    expect(response.errors).toBeUndefined()
    expect(response.data.__schema.queryType.name).toBe('Query')
  })

  it('should send basic query', async () => {
    const response = await yoga.inject({
      document: /* GraphQL */ `
        query {
          ping
        }
      `,
    })

    expect(response.statusCode).toBe(200)
    expect(response.data.ping).toBe('pong')
  })

  it('should send basic mutation', async () => {
    const response = await yoga.inject({
      document: /* GraphQL */ `
        mutation {
          echo(message: "hello")
        }
      `,
    })

    expect(response.statusCode).toBe(200)
    expect(response.errors).toBeUndefined()
    expect(response.data.echo).toBe('hello')
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

    expect(response.statusCode).toBe(200)
    expect(response.errors).toBeUndefined()
    expect(response.data.echo).toBe('hello')
  })

  it('should error on malformed query', async () => {
    const response = await yoga.inject({
      document: '{ query { ping }',
    })

    expect(response.errors).toBeDefined()
    expect(response.data).toBeUndefined()
  })

  it('should error missing query', async () => {
    // @ts-expect-error
    const response = await yoga.inject({ query: null })

    expect(response.data).toBeUndefined()
    expect(response.errors[0].message).toBe('Must provide query string.')
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
      mutation upload($file: Upload!) {
        singleUpload(image: $file)
      }
    `
    const response = await request(fastify.server)
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
      .then((res) => res.body)

    expect(response.errors).toBeUndefined()
    expect(response.data.singleUpload).toBe(true)
  })
})
