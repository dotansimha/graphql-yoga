import { AfterValidateHook } from '@envelop/core'
import { createGraphQLError } from '../error.js'
import { createSchema } from '../schema.js'
import { createYoga } from '../server.js'
import { Plugin } from './types.js'

const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type Query {
      _: String
    }
  `,
})

describe('Yoga Plugins', () => {
  it(`should respect Envelop's OnPluginInit's addPlugin`, async () => {
    const afterValidateHook: AfterValidateHook<Record<string, unknown>> = jest
      .fn()
      .mockImplementation(({ setResult }) => {
        setResult([
          createGraphQLError('My Error', { extensions: { my: 'error' } }),
        ])
      })
    const testPlugin: Plugin = {
      onValidate() {
        return afterValidateHook
      },
    }
    const testPluginToAdd: Plugin = {
      onPluginInit({ addPlugin }) {
        addPlugin(testPlugin)
      },
    }
    const yoga = createYoga({
      plugins: [testPluginToAdd],
      schema,
    })
    const response = await yoga.fetch('http://localhost:3000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '{hello}',
      }),
    })
    const result = await response.json()
    expect(result).toMatchObject({
      errors: [
        {
          extensions: {
            my: 'error',
          },
          message: 'My Error',
        },
      ],
    })
  })
  it('should process errors from onRequest hook correctly', async () => {
    const expectedStatus = 321
    const yoga = createYoga({
      schema,
      plugins: [
        {
          onRequest() {
            throw createGraphQLError('My Error', {
              extensions: {
                http: {
                  status: expectedStatus,
                },
              },
            })
          },
        },
      ],
    })
    const response = await yoga.fetch('http://localhost:3000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '{hello}',
      }),
    })
    expect(response.status).toBe(expectedStatus)
    const body = await response.json()
    expect(body).toMatchObject({
      errors: [
        {
          message: 'My Error',
        },
      ],
    })
  })
})
