import { createYoga, createSchema } from 'graphql-yoga'
import { useResponseCache } from '@graphql-yoga/plugin-response-cache'
import { GraphQLError } from 'graphql'

describe('Response Caching via ETag', () => {
  let cnt = 0
  afterEach(() => {
    cnt = 0
  })
  const yoga = createYoga({
    schema: createSchema({
      typeDefs: /* GraphQL */ `
        type Query {
          me(throwError: Boolean): User
        }
        type User {
          id: ID!
          name: String!
        }
      `,
      resolvers: {
        Query: {
          me: (_, { throwError }) => {
            if (throwError) throw new GraphQLError('Error')
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
        buildResponseCacheKey: async ({ documentString }) => documentString,
        includeExtensionMetadata: true,
      }),
    ],
  })
  it('should return an ETag header with the cache key', async () => {
    const query = '{me{id,name}}'
    const response = await yoga.fetch(
      'http://localhost:4000/graphql?query=' + query,
    )
    expect(response.headers.get('ETag')).toEqual(query)
  })
  it('should respond 304 when the ETag matches', async () => {
    const query = '{me{id,name}}'
    const response = await yoga.fetch(
      'http://localhost:4000/graphql?query=' + query,
      {
        headers: {
          'If-None-Match': query,
        },
      },
    )
    expect(response.status).toEqual(304)
    expect(cnt).toEqual(0)
  })
  it('should not send ETag if the result is not cached', async () => {
    const response = await yoga.fetch(
      'http://localhost:4000/graphql?query={me(throwError:true){id,name}}',
    )
    expect(response.headers.get('ETag')).toBeFalsy()
  })
})
