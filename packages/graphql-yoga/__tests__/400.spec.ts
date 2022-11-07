import { createSchema } from '../src/schema'
import { createYoga } from '../src/server'

describe('400 status code errors', () => {
  it('Handle invalid data type usage errors as 400', async () => {
    const yoga = createYoga({
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            ok: Boolean!
          }
          type Mutation {
            sendMessage(userId: Int!): String!
          }
        `,
        resolvers: {
          Mutation: {
            sendMessage: () => {
              return 'Your message'
            },
          },
          Query: {
            ok: () => true,
          },
        },
      }),
      maskedErrors: false,
    })

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: 'mutation { sendMessage(userId: "Simply not a user id") }',
      }),
    })

    expect(await response.json()).toMatchObject({
      errors: [
        {
          message:
            'Int cannot represent non-integer value: "Simply not a user id"',
        },
      ],
    })
    expect(response.status).toBe(400)
  })
})
