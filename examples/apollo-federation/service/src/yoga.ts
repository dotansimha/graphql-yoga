import { parse } from 'graphql'
import { buildSubgraphSchema } from '@apollo/subgraph'
import { createYoga } from 'graphql-yoga'

const typeDefs = parse(/* GraphQL */ `
  scalar File

  type Query {
    me: User
    readTextFile(file: File!): String
  }

  type User @key(fields: "id") {
    id: ID!
    username: String
  }
`)

const resolvers = {
  Query: {
    me() {
      return { id: '1', username: '@ava' }
    },
    readTextFile(_, { file }) {
      return file.text()
    },
  },
  User: {
    __resolveReference(user, { fetchUserById }) {
      return fetchUserById(user.id)
    },
  },
}

export const yoga = createYoga({
  schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
  maskedErrors: false,
})
