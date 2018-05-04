import test from 'ava'
import { inflate } from 'graphql-deduplicator'
import { GraphQLServer } from './index'
import { promisify } from 'util'
import * as request from 'request-promise-native'

test.beforeEach('start hello world', async t => {
  const randomId = () => Math.random().toString(36).substr(2, 5)

  const typeDefs = `
    type Author {
      id: ID!
      name: String!
      lastName: String!
    }

    type Book {
      id: ID!
      name: String!
      author: Author!
    }

    type Query {
      hello(name: String): String!
      books: [Book!]!
    }
    `

  const author = {
    __typename: 'Author',
    id: randomId(),
    name: 'Jhon',
    lastName: 'Doe'
  }
  const book = {
    __typename: 'Book',
    id: randomId(),
    name: 'Awesome',
    author
  }
  const resolvers = {
    Query: {
      hello: (_, { name }) => `Hello ${name || 'World'}`,
      books: () => Array(5).fill(book)
    },
  }

  const server = new GraphQLServer({ typeDefs, resolvers })

  const http = await server.start({ port: 0 })

  const { port } = http.address()
  const uri = `http://localhost:${port}/`

  t.context.http = http
  t.context.uri = uri
  t.context.book = book
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

test('Response data can be deduplicated with graphql-deduplicator', async t => {
  const { uri, book } = t.context

  const query = `
    query {
      books {
        __typename
        id
        name
        author {
          __typename
          id
          name
          lastName
        }
      }
    }
  `

  const body = await request({
    uri,
    method: 'POST',
    json: true,
    body: { query },
  }).promise()

  const deduplicated = await request({
    uri,
    method: 'POST',
    json: true,
    body: { query },
    headers: {
      'X-GraphQL-Deduplicate': true
    }
  }).promise()

  t.deepEqual(body, {
    data: {
      books: Array(5).fill(book)
    }
  })

  t.deepEqual(deduplicated, {
    data: {
      books: [
        book,
        ...Array(4).fill({
          __typename: book.__typename,
          id: book.id
        })
      ]
    }
  })

  t.deepEqual(body.data, inflate(deduplicated.data))
})
