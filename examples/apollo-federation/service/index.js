const { parse } = require('graphql')
const { buildSubgraphSchema } = require('@apollo/subgraph')
const { createServer } = require('@graphql-yoga/node')

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
const server = createServer({
  schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
  port: 4001,
})

server.start().then(() => {
  console.log(`🚀 Server ready at http://localhost:4001`)
})
