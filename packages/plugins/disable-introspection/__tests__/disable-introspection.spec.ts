import { useDisableIntrospection } from '@graphql-yoga/plugin-disable-introspection'
import { createYoga, createSchema } from 'graphql-yoga'

describe('disable introspection', () => {
  test('can disable introspection', async () => {
    const schema = createSchema({
      typeDefs: /* GraphQL */ `
        type Query {
          _: Boolean
        }
      `,
    })

    const yoga = createYoga({ schema, plugins: [useDisableIntrospection()] })

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: `{ __schema { types { name } } }` }),
    })

    expect(response.status).toEqual(200)
    const result = await response.json()
    expect(result.data).toEqual(undefined)
    expect(result.errors).toHaveLength(2)
  })

  test('can disable introspection conditionally', async () => {
    const schema = createSchema({
      typeDefs: /* GraphQL */ `
        type Query {
          _: Boolean
        }
      `,
    })

    const yoga = createYoga({
      schema,
      plugins: [
        useDisableIntrospection({
          isDisabled: () => true,
        }),
      ],
    })

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: `{ __schema { types { name } } }` }),
    })

    expect(response.status).toEqual(200)
    const result = await response.json()
    expect(result.data).toEqual(undefined)
    expect(result.errors).toHaveLength(2)
  })

  test('can disable introspection based on headers', async () => {
    const schema = createSchema({
      typeDefs: /* GraphQL */ `
        type Query {
          _: Boolean
        }
      `,
    })

    const yoga = createYoga({
      schema,
      plugins: [
        useDisableIntrospection({
          isDisabled: (request) =>
            request.headers.get('x-disable-introspection') === '1',
        }),
      ],
      // uncomment this and the tests will pass
      // validationCache: false,
    })

    // First request uses the header to disable introspection
    let response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-disable-introspection': '1',
      },
      body: JSON.stringify({ query: `{ __schema { types { name } } }` }),
    })

    expect(response.status).toEqual(200)
    let result = await response.json()
    expect(result.data).toEqual(undefined)
    expect(result.errors).toHaveLength(2)

    // Seconds request does not disable introspection
    response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: `{ __schema { types { name } } }` }),
    })

    expect(response.status).toEqual(200)
    result = await response.json()
    expect(result.data).toBeDefined()
    expect(result.errors).toBeUndefined()
  })
})
