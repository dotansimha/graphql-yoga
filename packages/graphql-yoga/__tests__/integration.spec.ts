import { getIntrospectionQuery } from 'graphql'
import { GraphQLServer } from 'graphql-yoga'
import request from 'supertest'
import { schema } from '../test-utils/schema'

const yoga = new GraphQLServer({ schema, enableLogging: false, uploads: true })

describe('Requests', () => {
  const fastify = yoga.fastify

  beforeAll(async () => {
    await fastify.ready()
  })

  afterAll(async () => {
    await fastify.close()
  })

  it('should send introspection query', async () => {
    const response = await request(fastify.server)
      .post('/graphql')
      .set('content-type', 'application/json')
      .send({
        query: getIntrospectionQuery(),
      })

    expect(response.status).toBe(200)
    expect(response.body.errors).toBeUndefined()
    expect(response.body.data.__schema.queryType.name).toBe('Query')
  })

  it('should send basic query', async () => {
    const response = await request(fastify.server)
      .post('/graphql')
      .send({
        query: /* GraphQL */ `
          query {
            ping
          }
        `,
      })

    expect(response.status).toBe(200)
    expect(response.body.errors).toBeUndefined()
    expect(response.body.data.ping).toBe('pong')
  })

  it('should send basic mutation', async () => {
    const response = await request(fastify.server)
      .post('/graphql')
      .send({
        query: /* GraphQL */ `
          mutation {
            echo(message: "hello")
          }
        `,
      })

    expect(response.status).toBe(200)
    expect(response.body.errors).toBeUndefined()
    expect(response.body.data.echo).toBe('hello')
  })

  it('should send variables', async () => {
    const response = await request(fastify.server)
      .post('/graphql')
      .send({
        query: /* GraphQL */ `
          mutation ($text: String) {
            echo(message: $text)
          }
        `,
        variables: {
          text: 'hello',
        },
      })

    expect(response.status).toBe(200)
    expect(response.body.errors).toBeUndefined()
    expect(response.body.data.echo).toBe('hello')
  })

  it('should error on malformed query', async () => {
    const response = await request(fastify.server)
      .post('/graphql')
      .send({
        query: '{ query { ping }',
      })
      .then((res) => JSON.parse(res.text))

    expect(response.errors).toBeDefined()
    expect(response.data).toBeUndefined()
  })

  it('should error missing query', async () => {
    const response = await request(fastify.server)
      .post('/graphql')
      .send({
        body: '',
      })
      .then((res) => JSON.parse(res.text))

    expect(response.data).toBeUndefined()
    expect(response.errors[0].message).toBe('Must provide query string.')
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
