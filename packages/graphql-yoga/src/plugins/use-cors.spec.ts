import { createSchema } from '../schema.js'
import { createYoga } from '../server.js'

describe('CORS', () => {
  describe('OPTIONS call', () => {
    it('should respond with correct status & headers', async () => {
      const schemaFactory = async () => {
        return createSchema({
          typeDefs: /* GraphQL */ `
            type Query {
              foo: String
            }
          `,
          resolvers: {
            Query: {
              foo: () => 'bar',
            },
          },
        })
      }
      const yoga = createYoga({
        schema: schemaFactory,
      })
      const result = await yoga.fetch('http://yoga/graphql', {
        method: 'OPTIONS',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      expect(result.status).toEqual(204)
      expect(result.headers.get('Content-Length')).toEqual('0')
    })
  })
})
