import 'reflect-metadata'
import request from 'supertest'

import { buildApp } from '../src/app.js'

describe('fastify-modules example integration', () => {
  const app = buildApp()

  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('sends GraphiQL', async () => {
    const response = await request(app.server).get('/graphql').set({
      accept: 'text/html',
    })

    expect(response.statusCode).toEqual(200)
    expect(response.text).toContain('<title>Yoga GraphiQL</title>')
  })

  it('handles query operation via POST', async () => {
    const response = await request(app.server)
      .post('/graphql')
      .set({ 'content-type': 'application/json' })
      .send(
        JSON.stringify({
          query: /* GraphQL */ `
            query {
              __typename
            }
          `,
        }),
      )

    expect(response.statusCode).toEqual(200)
    expect(response.body).toStrictEqual({
      data: {
        __typename: 'Query',
      },
    })
  })

  it('handles query operation via GET', async () => {
    const response = await request(app.server)
      .get('/graphql')
      .query({
        query: /* GraphQL */ `
          query {
            __typename
          }
        `,
      })

    expect(response.statusCode).toEqual(200)
    expect(response.body).toStrictEqual({
      data: {
        __typename: 'Query',
      },
    })
  })

  it('should find request in context', async () => {
    const response = await request(app.server)
      .post('/graphql')
      .set({ 'content-type': 'application/json' })
      .send(
        JSON.stringify({
          query: /* GraphQL */ `
            query {
              contextKeys
            }
          `,
        }),
      )

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('application/json')
    expect(response.body?.errors).toBeFalsy()
    expect(response.body?.data?.contextKeys).toContain('request')
  })

  it("exposes fastify's request and reply objects", async () => {
    const response = await request(app.server)
      .post('/graphql')
      .set({ 'content-type': 'application/json' })
      .send(
        JSON.stringify({
          query: /* GraphQL */ `
            query {
              contextKeys
            }
          `,
        }),
      )

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('application/json')
    expect(response.body?.errors).toBeFalsy()
    expect(response.body?.data?.contextKeys).toContain('req')
    expect(response.body?.data?.contextKeys).toContain('reply')
  })
})
