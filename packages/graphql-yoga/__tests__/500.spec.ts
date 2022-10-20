import { Plugin } from '@envelop/core'
import { createGraphQLError } from '@graphql-tools/utils'
import { GraphQLError } from 'graphql'
import { createSchema } from '../src/schema'
import { createYoga } from '../src/server'

describe('Handle non GraphQL Errors as 500 when error masking is disabled', () => {
  const errorVariationsForResolvers = {
    Error: new Error('Oops!'),
    WrappedError: createGraphQLError('Oops!', {
      originalError: new Error('Oops!'),
    }),
  }

  Object.entries(errorVariationsForResolvers).forEach(([name, error]) => {
    it(`${name} from resolvers`, async () => {
      const yoga = createYoga({
        schema: createSchema({
          typeDefs: /* GraphQL */ `
            type Query {
              foo: String
            }
          `,
          resolvers: {
            Query: {
              foo: () => {
                throw error
              },
            },
          },
        }),
        maskedErrors: false,
      })

      const response = await yoga.fetch('http://yoga/graphql', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: '{ foo }' }),
      })
      expect(await response.json()).toMatchObject({
        errors: [
          {
            message: 'Oops!',
          },
        ],
      })
      expect(response.status).toBe(500)
    })
  })
  const errorVariationsForContextFactory = {
    ...errorVariationsForResolvers,
    Object: { toString: () => 'Oops!' },
    String: 'Oops!',
  }
  Object.entries(errorVariationsForContextFactory).forEach(([name, error]) => {
    it(`${name} from context factory`, async () => {
      const yoga = createYoga({
        schema: createSchema({
          typeDefs: /* GraphQL */ `
            type Query {
              _: String
            }
          `,
        }),
        context: () => {
          throw error
        },
        maskedErrors: false,
      })

      const response = await yoga.fetch('http://yoga/graphql', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: '{ __typename }' }),
      })
      expect(await response.json()).toMatchObject({
        errors: [
          {
            message: 'Oops!',
          },
        ],
      })
      expect(response.status).toBe(500)
    })
  })
})
