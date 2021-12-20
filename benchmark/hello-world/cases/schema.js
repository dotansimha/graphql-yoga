const { makeExecutableSchema } = require('@graphql-tools/schema')

module.exports = ({ stop }) =>
  makeExecutableSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        hello: String!
      }
      type Mutation {
        stop: Boolean!
      }
    `,
    resolvers: {
      Query: {
        hello: () => 'Hello World',
      },
      Mutation: {
        stop,
      },
    },
  })
