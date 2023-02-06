import { createSchema, createYoga, Plugin } from '../src'
import { validate } from 'graphql'

describe('validation cache', () => {
  test('validation is cached', async () => {
    const validateFn = jest.fn(validate)
    const schema = createSchema({
      typeDefs: /* GraphQL */ `
        type Query {
          hi: String!
        }
      `,
      resolvers: {
        Query: {
          hi: () => 'hi',
        },
      },
    })
    const plugin: Plugin = {
      onValidate({ setValidationFn }) {
        setValidationFn(validateFn)
      },
    }
    const yoga = createYoga({
      schema,
      plugins: [plugin],
    })

    let response = await yoga.fetch('/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{ hi }' }),
    })
    expect(response.status).toEqual(200)
    expect(await response.text()).toMatchInlineSnapshot(
      `"{"data":{"hi":"hi"}}"`,
    )
    expect(validateFn).toHaveBeenCalledTimes(1)

    response = await yoga.fetch('/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{ hi }' }),
    })
    expect(response.status).toEqual(200)
    expect(await response.text()).toMatchInlineSnapshot(
      `"{"data":{"hi":"hi"}}"`,
    )
    expect(validateFn).toHaveBeenCalledTimes(1)
  })

  test('validation is cached with schema factory function', async () => {
    const validateFn = jest.fn(validate)
    const schema = createSchema({
      typeDefs: /* GraphQL */ `
        type Query {
          hi: String!
        }
      `,
      resolvers: {
        Query: {
          hi: () => 'hi',
        },
      },
    })
    const plugin: Plugin = {
      onValidate({ setValidationFn }) {
        setValidationFn(validateFn)
      },
    }
    const yoga = createYoga({
      schema: () => schema,
      plugins: [plugin],
    })

    let response = await yoga.fetch('/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{ hi }' }),
    })
    expect(response.status).toEqual(200)
    expect(await response.text()).toMatchInlineSnapshot(
      `"{"data":{"hi":"hi"}}"`,
    )
    expect(validateFn).toHaveBeenCalledTimes(1)

    response = await yoga.fetch('/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{ hi }' }),
    })
    expect(response.status).toEqual(200)
    expect(await response.text()).toMatchInlineSnapshot(
      `"{"data":{"hi":"hi"}}"`,
    )
    expect(validateFn).toHaveBeenCalledTimes(1)
  })

  test('validation is cached per unique schema returned from factory function', async () => {
    const validateFn = jest.fn(validate)
    const firstSchema = createSchema({
      typeDefs: /* GraphQL */ `
        type Query {
          hi: String!
          foo: String!
        }
      `,
      resolvers: {
        Query: {
          hi: () => 'hi',
          foo: () => 'foo',
        },
      },
    })
    const secondSchema = createSchema({
      typeDefs: /* GraphQL */ `
        type Query {
          hi: String!
        }
      `,
      resolvers: {
        Query: {
          hi: () => 'hi',
        },
      },
    })

    const document = /* GraphQL */ `
      query {
        hi
        foo
      }
    `

    let currentSchema = firstSchema

    const plugin: Plugin = {
      onValidate({ setValidationFn }) {
        setValidationFn(validateFn)
      },
    }

    const yoga = createYoga({ schema: () => currentSchema, plugins: [plugin] })

    let response = await yoga.fetch('/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: document }),
    })
    expect(response.status).toEqual(200)
    expect(await response.text()).toMatchInlineSnapshot(
      `"{"data":{"hi":"hi","foo":"foo"}}"`,
    )

    expect(validateFn).toHaveBeenCalledTimes(1)

    currentSchema = secondSchema

    response = await yoga.fetch('/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: document }),
    })
    expect(response.status).toEqual(200)
    expect(await response.text()).toMatchInlineSnapshot(
      `"{"errors":[{"message":"Cannot query field \\"foo\\" on type \\"Query\\".","locations":[{"line":4,"column":9}]}]}"`,
    )

    expect(validateFn).toHaveBeenCalledTimes(2)
  })
})
