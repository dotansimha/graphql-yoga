import { getIntrospectionQuery } from 'graphql'
import { GraphQLServer } from 'graphql-yoga'
import request from 'supertest'
import { schema } from '../test-utils/schema'

const yoga = new GraphQLServer({ schema, enableLogging: false, uploads: true })
const fastify = yoga.fastify

describe('Requests', () => {
  it('should send introspection query', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/graphql',
      payload: {
        query: getIntrospectionQuery(),
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().errors).toBeUndefined()
    expect(response.json().data.__schema.queryType.name).toBe('Query')
  })

  it('should send basic query', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/graphql',
      payload: {
        query: /* GraphQL */ `
          query {
            ping
          }
        `,
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().data.ping).toBe('pong')
  })

  it('should send basic mutation', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/graphql',
      payload: {
        query: /* GraphQL */ `
          mutation {
            echo(message: "hello")
          }
        `,
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().errors).toBeUndefined()
    expect(response.json().data.echo).toBe('hello')
  })

  it('should send variables', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/graphql',
      payload: {
        query: /* GraphQL */ `
          mutation ($text: String) {
            echo(message: $text)
          }
        `,
        variables: {
          text: 'hello',
        },
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().errors).toBeUndefined()
    expect(response.json().data.echo).toBe('hello')
  })

  it('should error on malformed query', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/graphql',
      payload: {
        query: '{ query { ping }',
      },
    })

    //  For some reason doing response.json() throws an error
    const body = JSON.parse(response.body)
    expect(body.errors).toBeDefined()
    expect(body.data).toBeUndefined()
  })

  it('should error missing query', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/graphql',
      payload: { body: '' },
    })

    //  For some reason doing response.json() throws an error
    const body = JSON.parse(response.body)
    expect(body.data).toBeUndefined()
    expect(body.errors[0].message).toBe('Must provide query string.')
  })
})

describe('Uploads', () => {
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
      .field('map', JSON.stringify({ 1: ['variables.file'] }))
      .attach('1', Buffer.from('test'), {
        filename: 'test.txt',
        contentType: 'text/plain',
      })
      .then((res) => JSON.parse(res.text))

    expect(response.errors).toBeUndefined()
    expect(response.data.singleUpload).toBe(true)
  })
})
