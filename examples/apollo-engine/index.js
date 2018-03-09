const { GraphQLServer } = require('graphql-yoga')
const compression = require('compression')

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

// Enable gzip compression
// ref: https://www.apollographql.com/docs/engine/setup-node.html#enabling-compression
server.express.use(compression())

server.start({
  apolloEngine: process.env.APOLLO_ENGINE_KEY,
  tracing: true,
  cacheControl: true
}, () => console.log('Server is running on localhost:4000'))
