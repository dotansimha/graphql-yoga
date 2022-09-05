import { createSchema } from '../src/schema'
import { createYoga } from '../src/server'

describe('Batching', () => {
  const yoga = createYoga({
    schema: createSchema({
      typeDefs: /* GraphQL */ `
        type Query {
          hello: String
          bye: String
        }
      `,
      resolvers: {
        Query: {
          hello: () => 'hello',
          bye: () => 'bye',
        },
      },
    }),
    batchingLimit: 2,
  })
  it('should support batching for JSON requests', async () => {
    const query1 = /* GraphQL */ `
      query {
        hello
      }
    `
    const query2 = /* GraphQL */ `
      query {
        bye
      }
    `
    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ query: query1 }, { query: query2 }]),
    })
    const result = await response.json()
    expect(result).toEqual([
      { data: { hello: 'hello' } },
      { data: { bye: 'bye' } },
    ])
  })
  it('should support batching for multipart requests', async () => {
    const query1 = /* GraphQL */ `
      query {
        hello
      }
    `
    const query2 = /* GraphQL */ `
      query {
        bye
      }
    `
    const formData = new yoga.fetchAPI.FormData()
    formData.append(
      'operations',
      JSON.stringify([{ query: query1 }, { query: query2 }]),
    )
    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/mixed; boundary=boundary',
      },
      body: formData,
    })
    const result = await response.json()
    expect(result).toEqual([
      { data: { hello: 'hello' } },
      { data: { bye: 'bye' } },
    ])
  })
  it('should throw an error if the limit is exceeded', async () => {
    const query1 = /* GraphQL */ `
      query {
        hello
      }
    `
    const query2 = /* GraphQL */ `
      query {
        bye
      }
    `
    const query3 = /* GraphQL */ `
      query {
        hello
      }
    `
    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        { query: query1 },
        { query: query2 },
        { query: query3 },
      ]),
    })
    expect(response.status).toBe(413)
    const result = await response.json()
    expect(result).toEqual({
      errors: [
        {
          message: 'Batching is limited to 2 operations per request.',
        },
      ],
    })
  })
})
