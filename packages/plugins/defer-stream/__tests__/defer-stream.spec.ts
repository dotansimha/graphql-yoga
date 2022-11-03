import { createYoga } from 'graphql-yoga'
import { useDeferStream } from '@graphql-yoga/plugin-defer-stream'
import {
  GraphQLList,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql'

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
})
