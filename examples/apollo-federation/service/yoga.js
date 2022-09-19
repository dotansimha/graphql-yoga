const { parse } = require('graphql')
const { buildSubgraphSchema } = require('@apollo/subgraph')
const { createYoga } = require('graphql-yoga')

const typeDefs = parse(/* GraphQL */ `
  type Query {
    me: User
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
  },
  User: {
    __resolveReference(user, { fetchUserById }) {
      return fetchUserById(user.id)
    },
  },
}

export const yoga = createYoga({
  schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
})
