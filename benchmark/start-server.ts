/* eslint-disable */
import { createServer, type IncomingMessage, ServerResponse } from 'http'
import { createYoga, createSchema, YogaServerInstance } from 'graphql-yoga'
import { useResponseCache } from '@graphql-yoga/plugin-response-cache'
import { useGraphQlJit } from '@envelop/graphql-jit'
import { faker } from '@faker-js/faker'

type Book = {
  id: string
  name: string
  numPages: number
}

type Author = {
  id: string
  name: string
  company: string
  books: Array<Book>
}

function generateData() {
  const authors: Array<Author> = []
  for (let i = 0; i < 20; i++) {
    const books: Array<Book> = []

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

type Context = {}

const schema = createSchema<Context>({
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

const yogaMap: Record<
  string,
  (_req: IncomingMessage, res: ServerResponse<IncomingMessage>) => void
> = {
  '/graphql': createYoga<Context>({
    schema,
    logging: false,
    multipart: false,
  }),
  '/graphql-jit': createYoga<Context>({
    schema,
    logging: false,
    multipart: false,
    plugins: [useGraphQlJit()],
    graphqlEndpoint: '/graphql-jit',
  }),
  '/graphql-response-cache': createYoga<Context>({
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
  '/graphql-no-parse-validate-cache': createYoga<Context>({
    schema,
    logging: false,
    multipart: false,
    parserAndValidationCache: false,
    graphqlEndpoint: '/graphql-no-parse-validate-cache',
  }),
  '/ping': (_req, res) => {
    res.writeHead(200)
    res.end()
  },
}

const server = createServer((req, res) => {
  const yoga = yogaMap[req.url!]
  if (yoga) {
    yoga(req, res)
  } else {
    res.writeHead(404)
    res.end()
  }
})

server.listen(4000, () => {
  console.log('ready')
})
