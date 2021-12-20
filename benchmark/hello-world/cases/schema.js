const { makeExecutableSchema } = require('@graphql-tools/schema')

module.exports = makeExecutableSchema({
  typeDefs: /* GraphQL */ `
    type Query {
      hello: String!
    }
  `,
  resolvers: {
    Query: {
      hello: () => 'Hello World',
    },
  },
})
