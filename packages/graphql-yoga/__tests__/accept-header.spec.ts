import { ExecutionResult } from 'graphql'
import { createSchema, createYoga, Repeater, Plugin } from 'graphql-yoga'

describe('accept header', () => {
  it('instruct server to return an event-stream with GET parameters', async () => {
    const yoga = createYoga({
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            ping: String
          }
        `,
      }),
    })

    const response = await yoga.fetch(`http://yoga/graphql?query=query{ping}`, {
      headers: {
        accept: 'text/event-stream',
      },
    })
    expect(response.headers.get('content-type')).toEqual('text/event-stream')
    const iterator = response.body![Symbol.asyncIterator]()
    const { value } = await iterator.next()
    const valueStr = Buffer.from(value).toString('utf-8')
    expect(valueStr).toContain(
      `data: ${JSON.stringify({ data: { ping: null } })}`,
    )
  })

  it('instruct server to return an event-stream with POST body', async () => {
    const yoga = createYoga({
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            ping: String
          }
        `,
      }),
    })

    const response = await yoga.fetch(`http://yoga/graphql`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'text/event-stream',
      },
      body: JSON.stringify({ query: '{ping}' }),
    })
    expect(response.headers.get('content-type')).toEqual('text/event-stream')
    const iterator = response.body![Symbol.asyncIterator]()
    const { value } = await iterator.next()
    const valueStr = Buffer.from(value).toString('utf-8')
    expect(valueStr).toContain(
      `data: ${JSON.stringify({ data: { ping: null } })}`,
    )
  })

  it('instruct server to return a multipart result with GET parameters', async () => {
    const yoga = createYoga({
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            ping: String
          }
        `,
        resolvers: {
          Query: { ping: () => 'pong' },
        },
      }),
    })

    const response = await yoga.fetch(`http://yoga/graphql?query=query{ping}`, {
      headers: {
        accept: 'multipart/mixed',
      },
    })
    expect(response.headers.get('content-type')).toEqual(
      'multipart/mixed; boundary="-"',
    )
    const valueStr = await response.text()
    // TODO: This test started failing after I replaced request(yoga) with yoga.fetch()
    expect(valueStr).toContain(`Content-Type: application/json; charset=utf-8`)
    expect(valueStr).toContain(`Content-Length: 24`)
    expect(valueStr).toContain(`${JSON.stringify({ data: { ping: 'pong' } })}`)
  })

  it('instruct server to return a multipart result with POST body', async () => {
    const yoga = createYoga({
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            ping: String
          }
        `,
        resolvers: {
          Query: { ping: () => 'pong' },
        },
      }),
    })

    // NOTE: this fails with content-type: application/json and body instead of query params
    // is that intended?
    const response = await yoga.fetch(`http://yoga/graphql`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'multipart/mixed',
      },
      body: JSON.stringify({ query: '{ping}' }),
    })
    expect(response.headers.get('content-type')).toEqual(
      'multipart/mixed; boundary="-"',
    )
    const valueStr = await response.text()
    // TODO: This test started failing after I replaced request(yoga) with yoga.fetch()
    expect(valueStr).toContain(`Content-Type: application/json; charset=utf-8`)
    expect(valueStr).toContain(`Content-Length: 24`)
    expect(valueStr).toContain(`${JSON.stringify({ data: { ping: 'pong' } })}`)
  })

  it('server rejects request for AsyncIterable source (subscription) when client only accepts application/json', async () => {
    const yoga = createYoga({
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            ping: String
          }
          type Subscription {
            counter: Int
          }
        `,
        resolvers: {
          Subscription: {
            counter: {
              subscribe: () =>
                new Repeater((push, end) => {
                  push(1)
                  push(2)
                  end()
                }),
              resolve: (t) => t,
            },
          },
        },
      }),
    })

    const response = await yoga.fetch(
      `http://yoga/graphql?query=subscription{counter}`,
      {
        headers: {
          accept: 'application/json',
        },
      },
    )
    expect(response.status).toEqual(406)
  })

  it('server rejects request for AsyncIterable source (defer/stream) when client only accepts application/json', async () => {
    // here we are faking a defer/stream response via a plugin by replacing the executor
    const plugin: Plugin = {
      onExecute(args) {
        args.setExecuteFn(() =>
          Promise.resolve(
            new Repeater<ExecutionResult<any, any>>((_push, end) => {
              end()
            }) as any,
          ),
        )
      },
    }

    const yoga = createYoga({
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            ping: String
          }
          type Subscription {
            counter: Int
          }
        `,
      }),
      plugins: [plugin],
    })

    const response = await yoga.fetch(`http://yoga/graphql?query=query{ping}`, {
      headers: {
        accept: 'application/json',
      },
    })
    expect(response.status).toEqual(406)
  })
})
