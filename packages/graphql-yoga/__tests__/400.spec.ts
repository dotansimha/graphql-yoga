import { createSchema } from '../src/schema'
import { createYoga } from '../src/server'
import { DateTimeResolver, DateTimeTypeDefinition } from 'graphql-scalars'
import { expect } from '@jest/globals'

describe('400 status code errors', () => {
  it('Handle invalid data type usage errors as 400', async () => {
    const yoga = createYoga({
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          ${DateTimeTypeDefinition}
          type Query {
            ok: Boolean!
          }
          type Mutation {
            sendMessage(data: MessageInput!): String!
          }
          input MessageInput {
            sendingDate: DateTime
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
          DateTime: DateTimeResolver,
        },
      }),
      maskedErrors: false,
    })

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: 'mutation($data: MessageInput!) { sendMessage(data: $data) }',
        variables: { data: { sendingDate: 'SOME TEXT' } },
      }),
    })

    expect(await response.json()).toMatchObject({
      errors: [
        {
          message: expect.stringContaining(
            'DateTime cannot represent an invalid date-time-string SOME TEXT.',
          ),
        },
      ],
    })
    expect(response.status).toBe(400)
  })
})
