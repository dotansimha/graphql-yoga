import { Client, createClient, OperationResult } from '@urql/core'
import { yogaExchange } from '@graphql-yoga/urql-exchange'
import { observableToAsyncIterable } from '@graphql-tools/utils'
import { pipe, toObservable } from 'wonka'
import { createYoga, createSchema } from 'graphql-yoga'
import { File } from '@whatwg-node/fetch'
import { createServer, Server } from 'http'
import { AddressInfo } from 'node:net'

describe.skip('URQL Yoga Exchange', () => {
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

  let server: Server
  let url: string
  let client: Client

  beforeAll(async () => {
    server = createServer(yoga)
    await new Promise<void>((resolve) => server.listen(0, hostname, resolve))
    const port = (server.address() as AddressInfo).port
    url = `http://${hostname}:${port}${endpoint}`
    client = createClient({
      url,
      exchanges: [
        yogaExchange({
          customFetch: yoga.fetch as WindowOrWorkerGlobalScope['fetch'],
        }),
      ],
    })
  })
  afterAll((done) => {
    server.close(done)
  })
  it('should handle queries correctly', async () => {
    const result = await client
      .query(
        /* GraphQL */ `
          query Greetings {
            hello
          }
        `,
        {},
      )
      .toPromise()
    expect(result.error).toBeUndefined()
    expect(result.data).toEqual({
      hello: 'Hello Urql Client!',
    })
  })
  it('should handle subscriptions correctly', async () => {
    const observable = pipe(
      client.subscription(
        /* GraphQL */ `
          subscription Time {
            time
          }
        `,
        {},
      ),
      toObservable,
    )

    const collectedValues: string[] = []
    let i = 0
    await new Promise<void>((resolve, reject) => {
      const subscription = observable.subscribe({
        next: (result) => {
          collectedValues.push(result.data?.time)
          i++
          if (i > 2) {
            subscription.unsubscribe()
            resolve()
          }
        },
        complete: () => {
          resolve()
        },
        error: (error) => {
          reject(error)
        },
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
