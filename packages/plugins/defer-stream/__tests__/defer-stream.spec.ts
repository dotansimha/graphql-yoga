import { createSchema, createYoga, Repeater } from 'graphql-yoga'
import { useDeferStream } from '@graphql-yoga/plugin-defer-stream'
import {
  GraphQLList,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql'
import { createServer } from 'node:http'
import { fetch } from '@whatwg-node/fetch'

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      hello: {
        type: GraphQLString,
        resolve: () => 'hello',
      },
      goodbye: {
        type: GraphQLString,
        resolve: () =>
          new Promise((resolve) => setTimeout(() => resolve('goodbye'), 1000)),
      },
      stream: {
        type: new GraphQLList(GraphQLString),
        async *resolve() {
          yield 'A'
          await new Promise((resolve) => setTimeout(resolve, 1000))
          yield 'B'
          await new Promise((resolve) => setTimeout(resolve, 1000))
          yield 'C'
        },
      },
    },
  }),
})

describe('Defer/Stream', () => {
  it('should error on defer directive usage when plugin is not used', async () => {
    const yoga = createYoga({
      schema,
    })
    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{ ... @defer { goodbye } }' }),
    })

    const body = await response.json()
    expect(body.errors).toBeDefined()
    expect(body.errors[0].message).toMatchInlineSnapshot(
      `"Unknown directive "@defer"."`,
    )
  })

  it('should error on stream directive usage when plugin is not used', async () => {
    const yoga = createYoga({
      schema,
    })
    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{ stream @stream }' }),
    })

    const body = await response.json()
    expect(body.errors).toBeDefined()
    expect(body.errors[0].message).toMatchInlineSnapshot(
      `"Unknown directive "@stream"."`,
    )
  })

  it('should execute on defer directive', async () => {
    const yoga = createYoga({
      schema,
      plugins: [useDeferStream()],
    })

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{ ... @defer { goodbye } }' }),
    })
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/event-stream')
    const chunks: string[] = []
    for await (const chunk of response.body!) {
      chunks.push(chunk.toString())
    }

    expect(chunks.length).toBe(2)
    expect(JSON.parse(chunks[0].replace('data:', ''))).toMatchInlineSnapshot(`
      {
        "data": {},
        "hasNext": true,
      }
    `)
    expect(JSON.parse(chunks[1].replace('data:', ''))).toMatchInlineSnapshot(`
      {
        "hasNext": false,
        "incremental": [
          {
            "data": {
              "goodbye": "goodbye",
            },
            "path": [],
          },
        ],
      }
    `)
  })

  it('should execute on stream directive', async () => {
    const yoga = createYoga({
      schema,
      plugins: [useDeferStream()],
    })

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{ stream @stream(initialCount: 2) }' }),
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/event-stream')
    const chunks: string[] = []
    for await (const chunk of response.body!) {
      chunks.push(chunk.toString())
    }

    expect(chunks.length).toBe(3)
    expect(chunks.map((c) => JSON.parse(c.replace('data:', ''))))
      .toMatchInlineSnapshot(`
      [
        {
          "data": {
            "stream": [
              "A",
              "B",
            ],
          },
          "hasNext": true,
        },
        {
          "hasNext": true,
          "incremental": [
            {
              "items": [
                "C",
              ],
              "path": [
                "stream",
                2,
              ],
            },
          ],
        },
        {
          "hasNext": false,
        },
      ]
    `)
  })

  it('correctly deals with the source upon aborted requests', async () => {
    const { source, push, terminate } = createPushPullAsyncIterable<string>()
    push('A')

    const yoga = createYoga({
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            hi: [String]
          }
        `,
        resolvers: {
          Query: {
            hi: () => source,
          },
        },
      }),
      plugins: [useDeferStream()],
    })

    const response = await yoga.fetch('http://yoga/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{ hi @stream }' }),
    })

    if (!response.body) {
      throw new Error('Missing body.')
    }

    let counter = 0

    for await (const chunk of response.body!) {
      // eslint-disable-next-line no-console
      console.log('case', counter)
      if (counter === 0) {
        expect(chunk.toString()).toBe(
          `data: {"data":{"hi":[]},"hasNext":true}\n\n`,
        )
      } else if (counter === 1) {
        expect(chunk.toString()).toBe(
          `data: {"incremental":[{"items":["A"],"path":["hi",0]}],"hasNext":true}\n\n`,
        )
        push('B')
      } else if (counter === 2) {
        expect(chunk.toString()).toBe(
          `data: {"incremental":[{"items":["B"],"path":["hi",1]}],"hasNext":true}\n\n`,
        )
        push('C')
      } else if (counter === 3) {
        expect(chunk.toString()).toBe(
          `data: {"incremental":[{"items":["C"],"path":["hi",2]}],"hasNext":true}\n\n`,
        )
        // when the source is returned this stream/loop should be exited.
        terminate()
        push('D')
      } else if (counter === 4) {
        expect(chunk.toString()).toBe(`data: {"hasNext":false}\n\n`)
      } else {
        throw new Error("LOL, this shouldn't happen.")
      }

      counter++
    }
  })

  it('correctly deals with the source upon aborted requests (real world)', async () => {
    const { source, push, terminate } = createPushPullAsyncIterable<string>()
    push('A')

    const yoga = createYoga({
      schema: createSchema({
        typeDefs: /* GraphQL */ `
          type Query {
            hi: [String]
          }
        `,
        resolvers: {
          Query: {
            hi: () => source,
          },
        },
      }),
      plugins: [useDeferStream()],
    })

    const server = createServer(yoga)

    try {
      await new Promise<void>((resolve) => {
        server.listen(() => {
          resolve()
        })
      })

      const port = (server.address() as any)?.port ?? null
      if (port === null) {
        throw new Error('Missing port...')
      }

      const response = await fetch(`http://localhost:${port}/graphql`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ query: '{ hi @stream }' }),
      })
      let counter = 0
      const toStr = (arr: Uint8Array) => Buffer.from(arr.buffer).toString()
      for await (const chunk of response.body!) {
        // eslint-disable-next-line no-console
        console.log('case', counter)
        if (counter === 0) {
          expect(toStr(chunk)).toBe(
            `data: {"data":{"hi":[]},"hasNext":true}\n\n`,
          )
        } else if (counter === 1) {
          expect(toStr(chunk)).toBe(
            `data: {"incremental":[{"items":["A"],"path":["hi",0]}],"hasNext":true}\n\n`,
          )
          push('B')
        } else if (counter === 2) {
          expect(toStr(chunk)).toBe(
            `data: {"incremental":[{"items":["B"],"path":["hi",1]}],"hasNext":true}\n\n`,
          )
          push('C')
        } else if (counter === 3) {
          expect(toStr(chunk)).toBe(
            `data: {"incremental":[{"items":["C"],"path":["hi",2]}],"hasNext":true}\n\n`,
          )
          // when the source is returned this stream/loop should be exited.
          terminate()
          push('D')
        } else if (counter === 4) {
          expect(toStr(chunk)).toBe(`data: {"hasNext":false}\n\n`)
        } else {
          throw new Error("LOL, this shouldn't happen.")
        }

        counter++
      }
    } finally {
      server.close()
    }
  })
})

type Deferred<T = void> = {
  resolve: (value: T) => void
  reject: (value: unknown) => void
  promise: Promise<T>
}

function createDeferred<T = void>(): Deferred<T> {
  const d = {} as Deferred<T>
  d.promise = new Promise<T>((resolve, reject) => {
    d.resolve = resolve
    d.reject = reject
  })
  return d
}

const createPushPullAsyncIterable = <T>(): {
  source: AsyncGenerator<T>
  push: (item: T) => void
  terminate: () => void
} => {
  const queue: Array<T> = []
  let d = createDeferred()
  let terminated = false

  const source = new Repeater<T>(async (push, stop) => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (terminated) {
        stop()
        return
      }
      let item: T | undefined
      while ((item = queue.shift())) {
        push(item)
      }
      await d.promise
    }
  })

  return {
    source,
    push: (item) => {
      queue.push(item)
      d.resolve()
      d = createDeferred()
    },
    terminate: () => {
      terminated = true
      d.resolve()
    },
  }
}
