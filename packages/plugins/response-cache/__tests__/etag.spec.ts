import { createYoga, createSchema } from 'graphql-yoga'
import { useResponseCache } from '@graphql-yoga/plugin-response-cache'

describe('Response Caching via ETag', () => {
  let cnt = 0
  afterEach(() => {
    cnt = 0
  })
  const exampleEtag = '123'
  const yoga = createYoga({
    schema: createSchema({
      typeDefs: /* GraphQL */ `
        type Query {
          me: User
        }
        type User {
          id: ID!
          name: String!
        }
      `,
      resolvers: {
        Query: {
          me: () => {
            cnt++
            return {
              id: '1',
              name: 'Bob',
            }
          },
        },
      },
    }),
    plugins: [
      useResponseCache({
        session: () => null,
        buildResponseCacheKey: async () => exampleEtag,
        includeExtensionMetadata: true,
      }),
    ],
  })
  it('should return an ETag header with the cache key', async () => {
    const response = await yoga.fetch(
      'http://localhost:4000/graphql?query={me{id,name}}',
    )
    expect(response.headers.get('ETag')).toEqual(exampleEtag)
  })
  it('should respond 304 when the ETag matches', async () => {
    const response = await yoga.fetch(
      'http://localhost:4000/graphql?query={me{id,name}}',
      {
        headers: {
          'If-None-Match': exampleEtag,
        },
      },
    )
    expect(response.status).toEqual(304)
    expect(cnt).toEqual(0)
  })
})
