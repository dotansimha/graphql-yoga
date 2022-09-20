import { GraphQLSchema } from 'graphql'
import { createSchema, createYoga, YogaInitialContext } from 'graphql-yoga'

describe('schema', () => {
  it('missing schema causes a error', async () => {
    const yoga = createYoga({})

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
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
    const schemaFactory = async (request: Request) => {
      const strFromContext = request.headers.get('str')
      return createSchema<YogaInitialContext>({
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
})
