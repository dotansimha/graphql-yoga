import { makeExecutableSchema } from '@graphql-tools/schema'
import { GraphQLSchema } from 'graphql'
import { createYoga, YogaInitialContext } from 'graphql-yoga'

describe('useSchema', () => {
  it('should accept a factory function', async () => {
    let count = 0
    const schemaFactory = async (request: Request) => {
      const countFromContext = request.headers.get('count')
      return makeExecutableSchema<YogaInitialContext>({
        typeDefs: /* GraphQL */ `
                type Query {
                    foo${countFromContext}: Boolean
                }
            `,
        resolvers: {
          Query: {
            [`foo${countFromContext}`]: (_, __, { request }) =>
              countFromContext === request.headers.get('count'),
          },
        },
      })
    }
    const yoga = createYoga({
      schema: schemaFactory,
    })
    while (true) {
      if (count === 3) {
        break
      }
      count++
      const query = /* GraphQL */ `
            query {
                foo${count}
            }
        `
      const result = await yoga.fetch('http://localhost:3000/graphql', {
        method: 'POST',
        body: JSON.stringify({ query }),
        headers: {
          count: count.toString(),
          'Content-Type': 'application/json',
        },
      })
      const { data } = await result.json()
      expect(data).toEqual({
        [`foo${count}`]: true,
      })
    }
    expect.assertions(3)
  })
  it('should accept a promise', async () => {
    const schemaPromise = new Promise<GraphQLSchema>((resolve) => {
      setTimeout(() => {
        resolve(
          makeExecutableSchema({
            typeDefs: /* GraphQL */ `
              type Query {
                foo: Boolean
              }
            `,
            resolvers: {
              Query: {
                foo: () => true,
              },
            },
          }),
        )
      }, 300)
    })
    const yoga = createYoga({
      schema: schemaPromise,
    })
    const query = /* GraphQL */ `
      query {
        foo
      }
    `
    const result = await yoga.fetch('http://localhost:3000/graphql', {
      method: 'POST',
      body: JSON.stringify({ query }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const { data } = await result.json()
    expect(data).toEqual({
      foo: true,
    })
  })
})
