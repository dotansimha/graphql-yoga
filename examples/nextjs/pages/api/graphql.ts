// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { createServer } from '@graphql-yoga/node'

const server = createServer({
  typeDefs: 'type Query {hello: String!}',
  resolvers: { Query: { hello: () => 'Hello World' } },
  cors: false,
  endpoint: '/api/graphql',
})

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
}

export default server.requestListener
