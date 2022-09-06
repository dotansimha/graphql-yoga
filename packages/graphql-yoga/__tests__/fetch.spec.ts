import { createSchema } from '../src/schema'
import { createYoga } from '../src/server'

describe('Internal Fetch API', () => {
  const yoga = createYoga({
    schema: createSchema({
      typeDefs: /* GraphQL */ `
        type Query {
          hello: String
        }
      `,
      resolvers: {
        Query: {
          hello: () => 'hello',
        },
      },
    }),
  })
  it('should accept relative paths as URL', async () => {
    const response = await yoga.fetch('/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: /* GraphQL */ `
          query {
            hello
          }
        `,
      }),
    })
    expect(response.status).toBe(200)
    const result = await response.json()
    expect(result).toEqual({
      data: {
        hello: 'hello',
      },
    })
  })
})
