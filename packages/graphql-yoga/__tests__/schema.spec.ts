/* eslint-disable @typescript-eslint/require-await */
import { GraphQLSchema } from 'graphql'

import { createSchema, createYoga, YogaInitialContext } from '../src/index.js'

describe('schema', () => {
  it('missing schema causes a error', async () => {
    const yoga = createYoga({})

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        accept: 'application/graphql-response+json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        query: '{ __typename }',
      }),
    })

    expect(response.status).toEqual(500)
    expect(await response.json()).toMatchObject({
      errors: [
        {
          message: 'Unexpected error.',
        },
      ],
    })
  })

  it('schema factory function', async () => {
    const schemaFactory = async (ctx: YogaInitialContext) => {
      const strFromContext = ctx.request.headers.get('str')
      return createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            foo: String
          }
        `,
        resolvers: {
          Query: {
            foo: () => strFromContext,
          },
        },
      })
    }
    const yoga = createYoga({
      schema: schemaFactory,
    })
    const query = `{foo}`
    let result = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      body: JSON.stringify({ query }),
      headers: {
        str: 'foo',
        'Content-Type': 'application/json',
      },
    })
    expect(await result.json()).toEqual({
      data: { foo: 'foo' },
    })
    result = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      body: JSON.stringify({ query }),
      headers: {
        str: 'bars',
        'Content-Type': 'application/json',
      },
    })
    expect(await result.json()).toEqual({
      data: { foo: 'bars' },
    })
  })

  it('fails if factory function does not return a schema', async () => {
    const schemaFactory = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return null as any
    }

    const yoga = createYoga({
      schema: schemaFactory,
      maskedErrors: false,
    })
    const query = `{foo}`
    const result = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      body: JSON.stringify({ query }),
      headers: {
        str: 'foo',
        'Content-Type': 'application/json',
      },
    })
    expect(await result.json()).toEqual({
      errors: [
        {
          message: `No schema found for this request. Make sure you use this plugin with GraphQL Yoga.`,
        },
      ],
    })
  })

  it('schema promise', async () => {
    const schemaPromise = Promise.resolve(
      createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            foo: Boolean
          }
        `,
        resolvers: {
          Query: {
            foo: () => true,
          },
        },
      }),
    )
    const yoga = createYoga({
      schema: schemaPromise,
    })
    const query = /* GraphQL */ `
      query {
        foo
      }
    `
    const result = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      body: JSON.stringify({ query }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const { data } = await result.json()
    expect(data).toEqual({
      foo: true,
    })
  })

  it('fails if promise does not resolve to a schema', async () => {
    const schemaPromise = Promise.resolve(null as unknown as GraphQLSchema)
    const yoga = createYoga({
      schema: schemaPromise,
      maskedErrors: false,
    })
    const query = /* GraphQL */ `
      query {
        foo
      }
    `
    const result = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      body: JSON.stringify({ query }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const { errors } = await result.json()
    expect(errors).toEqual([
      {
        message: `You provide a promise of a schema but it hasn't been resolved yet. Make sure you use this plugin with GraphQL Yoga.`,
      },
    ])
  })

  it('schema factory returning a promise', async () => {
    const yoga = createYoga({
      schema: () =>
        Promise.resolve(
          createSchema({
            typeDefs: /* GraphQL */ `
              type Query {
                foo: Boolean
              }
            `,
            resolvers: {
              Query: {
                foo: () => true,
              },
            },
          }),
        ),
    })
    const query = /* GraphQL */ `
      query {
        foo
      }
    `
    const result = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      body: JSON.stringify({ query }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const { data } = await result.json()
    expect(data).toEqual({
      foo: true,
    })
  })

  it('fails if factory function returning a promise does not resolve to a schema', async () => {
    const yoga = createYoga({
      schema: () => Promise.resolve(null as unknown as GraphQLSchema),
      maskedErrors: false,
    })
    const query = /* GraphQL */ `
      query {
        foo
      }
    `
    const result = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      body: JSON.stringify({ query }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const { errors } = await result.json()
    expect(errors).toEqual([
      {
        message: `No schema found for this request. Make sure you use this plugin with GraphQL Yoga.`,
      },
    ])
  })

  it('schema promise is not resolved until GraphQL execution starts', async () => {
    const schemaPromise: PromiseLike<GraphQLSchema> = {
      then: jest.fn(async (callback) => {
        return callback!(
          createSchema({
            typeDefs: /* GraphQL */ `
              type Query {
                foo: Boolean
              }
            `,
            resolvers: {
              Query: {
                foo: () => true,
              },
            },
          }),
        )
      }),
    }
    const yoga = createYoga({
      schema: schemaPromise as Promise<GraphQLSchema>,
      plugins: [
        {
          onRequest({ url, fetchAPI, endResponse }) {
            if (url.pathname === '/some-path') {
              endResponse(new fetchAPI.Response('some response'))
            }
          },
        },
      ],
    })
    const response = await yoga.fetch('http://yoga/some-path')
    expect(response.status).toEqual(200)
    const responseText = await response.text()
    expect(responseText).toEqual('some response')
    expect(schemaPromise.then).not.toHaveBeenCalled()
    const responseWithGraphQL = await yoga.fetch(
      'http://yoga/graphql?query={foo}',
    )
    expect(schemaPromise.then).toHaveBeenCalled()
    const { data } = await responseWithGraphQL.json()
    expect(data).toEqual({
      foo: true,
    })
  })

  it('schema factory should never been called until GraphQL execution starts', async () => {
    const schemaFactory = jest.fn(async () => {
      return createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            foo: Boolean
          }
        `,
        resolvers: {
          Query: {
            foo: () => true,
          },
        },
      })
    })
    const yoga = createYoga({
      schema: schemaFactory,
      plugins: [
        {
          onRequest({ url, fetchAPI, endResponse }) {
            if (url.pathname === '/some-path') {
              endResponse(new fetchAPI.Response('some response'))
            }
          },
        },
      ],
    })
    const response = await yoga.fetch('http://yoga/some-path')
    expect(response.status).toEqual(200)
    const responseText = await response.text()
    expect(responseText).toEqual('some response')
    expect(schemaFactory).not.toHaveBeenCalled()
    const responseWithGraphQL = await yoga.fetch(
      'http://yoga/graphql?query={foo}',
    )
    expect(schemaFactory).toHaveBeenCalled()
    const { data } = await responseWithGraphQL.json()
    expect(data).toEqual({
      foo: true,
    })
  })
})
