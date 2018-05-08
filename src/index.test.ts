import test from 'ava'
import { GraphQLServer } from './index'
import { promisify } from 'util'
import * as request from 'request-promise-native'

test.beforeEach('start hello world', async t => {
  const typeDefs = `
    type Query {
        hello(name: String): String!
    }
    `

  const resolvers = {
    Query: {
      hello: (_, { name }) => `Hello ${name || 'World'}`,
    },
  }

  const server = new GraphQLServer({ typeDefs, resolvers })

  const http = await server.start({ port: 0 })

  const { port } = http.address()
  const uri = `http://localhost:${port}/`

  t.context.http = http
  t.context.uri = uri
})

test.afterEach.always('stop hello world', async t => {
  const { http } = t.context
  await promisify(http.close).call(http)
})

test('works with simple hello world server', async t => {
  const { uri } = t.context

  const query = `
    query {
        hello(name: "Sarah")
    }
  `

  const body = await request({
    uri,
    method: 'POST',
    json: true,
    body: { query },
  }).promise()

  t.deepEqual(body, {
    data: {
      hello: 'Hello Sarah',
    },
  })
})
