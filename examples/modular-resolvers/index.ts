import { GraphQLServer } from 'graphql-yoga'
import { default as typeDefs } from './typeDefs'
import { default as resolvers } from './resolvers'

const options = { port: 4004 }

const server = new GraphQLServer({
  typeDefs,
  resolvers,
})

server
  .start(options, () =>
    console.log(`Server is running ⚡ on localhost:${options.port}`),
  )
  .catch((err) => console.error('connection Error', err))
