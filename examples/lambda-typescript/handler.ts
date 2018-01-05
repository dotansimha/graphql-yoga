import { GraphQLServerLambda } from 'graphql-yoga'

const typeDefs = `
  type Query {
    hello(name: String): String
  }
`

const resolvers = {
  Query: {
    hello: (_, { name }) => `Hello ${name || 'world'}`,
  },
}

const server = new GraphQLServerLambda({
  typeDefs,
  resolvers,
})

export const server = server.graphqlHandler
export const playground = server.playgroundHandler
