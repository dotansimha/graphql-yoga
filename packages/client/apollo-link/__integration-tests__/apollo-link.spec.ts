import { ApolloClient, FetchResult, InMemoryCache } from '@apollo/client/core'
import { createYoga, createSchema } from 'graphql-yoga'
import { createServer, Server } from 'http'
import { parse } from 'graphql'
import { YogaLink } from '@graphql-yoga/apollo-link'
import { File } from '@whatwg-node/fetch'
import { AddressInfo } from 'net'

describe.skip('Yoga Apollo Link', () => {
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

  let server: Server
  let url: string
  let client: ApolloClient<any>

  beforeAll(async () => {
    server = createServer(yoga)
    await new Promise<void>((resolve) => server.listen(0, hostname, resolve))
    const port = (server.address() as AddressInfo).port
    url = `http://${hostname}:${port}${endpoint}`
    client = new ApolloClient({
      link: new YogaLink({
        endpoint: url,
        fetch: yoga.fetch as WindowOrWorkerGlobalScope['fetch'],
      }),
      cache: new InMemoryCache(),
    })
  })
  afterAll(() => new Promise(resolve => {
    server.close(() => resolve())
  }))
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
    expect.assertions(5)
    const observable = client.subscribe({
      query: parse(/* GraphQL */ `
        subscription Time {
          time
        }
      `),
    })
    const collectedValues: string[] = []
    let i = 0
    await new Promise<void>((resolve) => {
      const subscription = observable.subscribe((result: FetchResult) => {
        collectedValues.push(result.data?.time)
        i++
        if (i > 2) {
          subscription.unsubscribe()
          resolve()
        }
      })
    })
    expect(collectedValues.length).toBe(3)
    expect(i).toBe(3)
    const now = new Date()
    for (const value of collectedValues) {
      expect(new Date(value).getFullYear()).toBe(now.getFullYear())
    }
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
