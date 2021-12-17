// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { GraphQLServer } from 'graphql-yoga'
import { NextApiRequest, NextApiResponse } from 'next'

const server = new GraphQLServer({
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
