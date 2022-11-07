import { createSchema, createYoga } from 'graphql-yoga'
import { DateResolver } from 'graphql-scalars'

describe('graphql-scalars', () => {
  const yoga = createYoga({
    schema: createSchema({
      typeDefs: /* GraphQL */ `
        scalar Date

        type Query {
          getDate(date: Date!): Date!
        }
      `,
      resolvers: {
        Date: DateResolver,
        Query: {
          getDate: (_, { date }) => {
            return date
          },
        },
      },
    }),
  })

  it('should respond with 400 if scalar parsing fails', async () => {
    const res = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: /* GraphQL */ `
          query GetDate($date: Date!) {
            getDate(date: $date)
          }
        `,
        variables: {
          date: 'NaD',
        },
      }),
    })

    expect(res.status).toBe(400)
  })
})
