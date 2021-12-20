const { ApolloServer } = require('apollo-server')
const createSchema = require('./schema')

const apolloServer = new ApolloServer({
  schema: createSchema({ stop: () => apolloServer.stop() }),
})

apolloServer.apolloServer.listen(4000)
