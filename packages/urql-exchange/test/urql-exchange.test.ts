import { createClient, OperationResult } from '@urql/core'
import { yogaExchange } from '@graphql-yoga/urql-exchange'
import { observableToAsyncIterable } from '@graphql-tools/utils'
import { pipe, toObservable } from 'wonka'
import { createYoga } from 'graphql-yoga'
import { createSchema } from 'graphql-yoga/schema'
import { File } from '@whatwg-node/fetch'
import { createServer } from 'http'

describe('graphExchange', () => {
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
          hello: () => 'Hello Urql Client!',
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
  const client = createClient({
    url,
    exchanges: [
      yogaExchange({
        customFetch: yoga.fetchAPI.fetch,
      }),
    ],
  })
  beforeAll(async () => {
    await new Promise<void>((resolve) => server.listen(port, hostname, resolve))
  })
  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve))
  })
  it('should handle queries correctly', async () => {
    const result = await client
      .query(
        /* GraphQL */ `
          query Greetings {
            hello
          }
        `,
      )
      .toPromise()
    expect(result.error).toBeUndefined()
    expect(result.data).toEqual({
      hello: 'Hello Urql Client!',
    })
  })
  it('should handle subscriptions correctly', async () => {
    const observable = pipe(
      client.subscription(/* GraphQL */ `
        subscription Time {
          time
        }
      `),
      toObservable,
    )

    const asyncIterable =
      observableToAsyncIterable<OperationResult<any>>(observable)
    let i = 0
    for await (const result of asyncIterable) {
      i++
      if (i === 2) {
        break
      }
      expect(result.error).toBeFalsy()
      const date = new Date(result?.data?.time)
      expect(date.getFullYear()).toBe(new Date().getFullYear())
    }
    expect(i).toBe(2)
  })
  it('should handle file uploads correctly', async () => {
    const query = /* GraphQL */ `
      mutation readFile($file: File!) {
        readFile(file: $file)
      }
    `
    const result = await client
      .mutation(query, {
        file: new File(['Hello World'], 'file.txt', { type: 'text/plain' }),
      })
      .toPromise()
    expect(result.error).toBeFalsy()
    expect(result.data).toEqual({
      readFile: 'Hello World',
    })
  })
})
