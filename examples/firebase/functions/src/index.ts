import * as functions from 'firebase-functions'
import { createSchema, createYoga } from 'graphql-yoga'

interface ServerContext {
  req: functions.https.Request
  res: functions.Response
}

const yoga = createYoga<ServerContext>({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        greetings: String!
      }
    `,
    resolvers: {
      Query: {
        greetings: () => 'Hello Firebase!',
      },
    },
  }),
  graphqlEndpoint: '*',
})

export const graphql = functions.https.onRequest(yoga)
