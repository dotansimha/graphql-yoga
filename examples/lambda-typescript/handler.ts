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

const lambda = new GraphQLServerLambda({
  typeDefs,
  resolvers,
})

export const server = lambda.graphqlHandler
export const playground = lambda.playgroundHandler
