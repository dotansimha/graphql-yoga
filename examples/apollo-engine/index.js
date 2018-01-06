const { GraphQLServer } = require('graphql-yoga')
const { Engine } = require('apollo-engine')

const typeDefs = `
  type Query {
    hello(name: String): String!
  }`

const resolvers = {
  Query: {
    hello: (_, { name }) => `Hello ${name || 'World'}`,
  },
}

const server = new GraphQLServer({ typeDefs, resolvers })

const engine = new Engine({
  engineConfig: { apiKey: process.env.APOLLO_ENGINE_KEY },
  endpoint: '/',
  graphqlPort: parseInt(process.env.Port, 10) || 4000,
})
engine.start();

server.express.use(engine.expressMiddleware())

server.start(() => console.log('Server is running on localhost:4000'))
