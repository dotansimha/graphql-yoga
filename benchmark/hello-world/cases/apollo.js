const { ApolloServer } = require('apollo-server')
const schema = require('./schema')

const apolloServer = new ApolloServer({
  schema,
})

apolloServer.listen(4000)
