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
    const lastModified = response.headers.get('Last-Modified')
    expect(lastModified).toBeTruthy()
    const lastModifiedDate = new Date(
      lastModified || 'Expected Last-Modified to be a valid date',
    )
    expect(lastModifiedDate).toBeInstanceOf(Date)
    expect(lastModifiedDate.toString()).not.toEqual('Invalid Date')
    expect(lastModifiedDate.getDate()).toEqual(new Date().getDate())
  })
  it('should respond 304 when the ETag and Last-Modified matches', async () => {
    const tomorrow = new Date()
    const query = '{me{id,name}}'
    const response = await yoga.fetch(
      'http://localhost:4000/graphql?query=' + query,
      {
        headers: {
          'If-None-Match': query,
          'If-Modified-Since': tomorrow.toString(),
        },
      },
    )
    expect(response.status).toEqual(304)
    expect(cnt).toEqual(0)
  })
  it.only('should not send ETag or Last-Modified if the result is not cached', async () => {
    const response = await yoga.fetch(
      'http://localhost:4000/graphql?query={me(throwError:true){id,name}}',
    )
    expect(response.headers.get('ETag')).toBeFalsy()
    expect(response.headers.get('Last-Modified')).toBeFalsy()
  })
})
