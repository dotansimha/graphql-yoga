const { GraphQLServer, PubSub } = require('graphql-yoga')
const { ApolloEngine } = require('apollo-engine')

const typeDefs = `
  type Query {
    hello(name: String): String!
  }

  type Counter {
    count: Int!
    countStr: String
  }

  type Subscription {
    counter: Counter!
  }
`

const resolvers = {
  Query: {
    hello: (_, { name }) => `Hello ${name || 'World'}`,
  },
  Counter: {
    countStr: counter => `Current count: ${counter.count}`,
  },
  Subscription: {
    counter: {
      subscribe: (parent, args, { pubsub }) => {
        const channel = Math.random()
          .toString(36)
          .substring(2, 15) // random channel name
        let count = 0
        setInterval(
          () => pubsub.publish(channel, { counter: { count: count++ } }),
          2000,
        )
        return pubsub.asyncIterator(channel)
      },
    },
  },
}

const pubsub = new PubSub()
const port = parseInt(process.env.PORT, 10) || 4000
const graphQLServer = new GraphQLServer({
  typeDefs,
  resolvers,
  context: { pubsub },
})

if (process.env.APOLLO_ENGINE_KEY) {
  const engine = new ApolloEngine({
    apiKey: process.env.APOLLO_ENGINE_KEY,
  })

  const httpServer = graphQLServer.createHttpServer({
    tracing: true,
    cacheControl: true,
  })

  engine.listen(
    {
      port,
      httpServer,
      graphqlPaths: ['/'],
    },
    () =>
      console.log(
        `Server with Apollo Engine is running on http://localhost:${port}`,
      ),
  )
} else {
  graphQLServer.start(
    {
      port,
    },
    () => console.log(`Server is running on http://localhost:${port}`),
  )
}
