import { createSchema, createYoga } from 'graphql-yoga'
import type { IncomingMessage, ServerResponse } from 'node:http'

const graphqlEndpoint = '/graphql'

const yoga = createYoga({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        greetings: String
      }
    `,
    resolvers: {
      Query: {
        greetings: () =>
          'This is the `greetings` field of the root `Query` type',
      },
    },
  }),
  graphqlEndpoint,
})

export function graphql(req: IncomingMessage, res: ServerResponse) {
  req.url = graphqlEndpoint + req.url
  return yoga(req, res)
}
