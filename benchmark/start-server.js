/* eslint-disable */
import { createServer } from 'http'
import { createYoga, createSchema } from 'graphql-yoga'
import { useResponseCache } from '@graphql-yoga/plugin-response-cache'
import { useGraphQlJit } from '@envelop/graphql-jit'
import { faker } from '@faker-js/faker'

function generateData() {
  const authors = []
  for (let i = 0; i < 20; i++) {
    const books = []

    for (let k = 0; k < 3; k++) {
      books.push({
        id: faker.datatype.uuid(),
        name: faker.internet.domainName(),
        numPages: faker.datatype.number(),
      })
    }

    authors.push({
      id: faker.datatype.uuid(),
      name: faker.name.fullName(),
      company: faker.company.bs(),
      books,
    })
  }

  return authors
}

const data = generateData()

const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type Author {
      id: ID!
      name: String!
      company: String!
      books: [Book!]!
    }
    type Book {
      id: ID!
      name: String!
      numPages: Int!
    }
    type Query {
      authors: [Author!]!
    }
  `,
  resolvers: {
    Author: {},
    Query: {
      authors: () => data,
    },
  },
})

const yogaMap = {
  '/graphql': createYoga({
    schema,
    logging: false,
    multipart: false,
  }),
  '/graphql-jit': createYoga({
    schema,
    logging: false,
    multipart: false,
    plugins: [useGraphQlJit()],
    graphqlEndpoint: '/graphql-jit',
  }),
  '/graphql-response-cache': createYoga({
    schema,
    logging: false,
    multipart: false,
    plugins: [
      useResponseCache({
        // global cache
        session: () => null,
      }),
    ],
    graphqlEndpoint: '/graphql-response-cache',
  }),
  '/graphql-no-parse-validate-cache': createYoga({
    schema,
    logging: false,
    multipart: false,
    validationCache: false,
    parseCache: false,
    graphqlEndpoint: '/graphql-no-parse-validate-cache',
  }),
}

const server = createServer((req, res) => {
  const yoga = yogaMap[req.url]
  if (yoga) {
    yoga(req, res)
  } else {
    res.writeHead(404)
    res.end()
  }
})

server.listen(4000, '127.0.0.1')
