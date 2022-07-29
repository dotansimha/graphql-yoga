import { ApolloClient, FetchResult, InMemoryCache } from '@apollo/client/core'
import { createYoga } from 'graphql-yoga'
import { createSchema } from 'graphql-yoga/schema'
import { createServer } from 'http'
import { parse } from 'graphql'
import { observableToAsyncIterable } from '@graphql-tools/utils'
import { YogaLink } from '@graphql-yoga/apollo-link'
import { File } from '@whatwg-node/fetch'

describe('Yoga Apollo Link', () => {
  const port = 4000 + Math.floor(Math.random() * 1000)
  const endpoint = '/graphql'
  const hostname = '127.0.0.1'
  const yoga = createYoga({
    graphqlEndpoint: endpoint,
    logging: false,
    maskedErrors: false,
    schema: createSchema({
      typeDefs: /* GraphQL */ `
        scalar File
        type Query {
          hello: String
        }
        type Mutation {
          readFile(file: File!): String!
        }
        type Subscription {
          time: String
        }
      `,
      resolvers: {
        Query: {
          hello: () => 'Hello Apollo Client!',
        },
        Mutation: {
          readFile: (_, args: { file: File }) => args.file.text(),
        },
        Subscription: {
          time: {
            async *subscribe() {
              while (true) {
                await new Promise((resolve) => setTimeout(resolve, 1000))
                yield new Date().toISOString()
              }
            },
            resolve: (str) => str,
          },
        },
      },
    }),
  })
  const server = createServer(yoga)
  const url = `http://${hostname}:${port}${endpoint}`
  const client = new ApolloClient({
    link: new YogaLink({
      endpoint: url,
      customFetch: yoga.fetchAPI.fetch,
    }),
    cache: new InMemoryCache(),
  })
  beforeAll(async () => {
    await new Promise<void>((resolve) => server.listen(port, hostname, resolve))
  })
  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve))
  })
  it('should handle queries correctly', async () => {
    const result = await client.query({
      query: parse(/* GraphQL */ `
        query Greetings {
          hello
        }
      `),
    })
    expect(result.error).toBeUndefined()
    expect(result.errors?.length).toBeFalsy()
    expect(result.data).toEqual({
      hello: 'Hello Apollo Client!',
    })
  })
  it('should handle subscriptions correctly', async () => {
    const observable = client.subscribe({
      query: parse(/* GraphQL */ `
        subscription Time {
          time
        }
      `),
    })
    const asyncIterable =
      observableToAsyncIterable<
        FetchResult<any, Record<string, any>, Record<string, any>>
      >(observable)
    let i = 0
    for await (const result of asyncIterable) {
      i++
      if (i === 2) {
        break
      }
      expect(result.errors?.length).toBeFalsy()
      const date = new Date(result?.data?.time)
      expect(date.getFullYear()).toBe(new Date().getFullYear())
    }
    expect(i).toBe(2)
  })
  it('should handle file uploads correctly', async () => {
    const result = await client.mutate({
      mutation: parse(/* GraphQL */ `
        mutation readFile($file: File!) {
          readFile(file: $file)
        }
      `),
      variables: {
        file: new File(['Hello World'], 'file.txt', { type: 'text/plain' }),
      },
    })
    expect(result.errors?.length).toBeFalsy()
    expect(result.data).toEqual({
      readFile: 'Hello World',
    })
  })
})
