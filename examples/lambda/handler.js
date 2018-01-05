const { GraphQLServerLambda } = require('graphql-yoga')

const typeDefs = `
  type Query {
    hello(name: String): String
  }
`

const resolvers = {
  Query: {
    hello: (_,{ name }) => `Hello ${name || 'world'}`
  }
}

const server = new GraphQLServerLambda({ 
  typeDefs,
  resolvers
})

exports.server = server.graphqlHandler
exports.playground = server.playgroundHandler
