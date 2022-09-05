import { useDisableIntrospection } from '@envelop/disable-introspection'
import { getIntrospectionQuery, GraphQLError } from 'graphql'
import { createSchema, createYoga } from 'graphql-yoga'

function createTestSchema() {
  return createSchema<any>({
    typeDefs: /* GraphQL */ `
      type Query {
        hello: String
        hi: String
      }
    `,
    resolvers: {
      Query: {
        hello: () => {
          throw new GraphQLError('This error never gets masked.')
        },
        hi: () => {
          throw new Error('This error will get mask if you enable maskedError.')
        },
      },
    },
  })
}

describe('introspection', () => {
  it('introspection succeeds without plugin', async () => {
    const yoga = createYoga({ schema: createTestSchema(), logging: false })
    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: getIntrospectionQuery() }),
    })

    expect(response.status).toBe(200)
    const body = JSON.parse(await response.text())
    expect(body.errors).toBeUndefined()
    expect(body.data?.__schema.queryType.name).toBe('Query')
  })

  it('introspection fails when disabled via plugin', async () => {
    const yoga = createYoga({
      schema: createTestSchema(),
      logging: false,
      plugins: [useDisableIntrospection()],
    })
    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: getIntrospectionQuery() }),
    })

    expect(response.status).toBe(400)
    expect(response.headers.get('content-type')).toBe(
      'application/graphql-response+json; charset=utf-8',
    )
    const body = await response.json()
    expect(body.data).toBeUndefined()
    expect(body.errors![0]).toMatchInlineSnapshot(`
            Object {
              "locations": Array [
                Object {
                  "column": 7,
                  "line": 3,
                },
              ],
              "message": "GraphQL introspection has been disabled, but the requested query contained the field \\"__schema\\".",
            }
          `)
  })
})
