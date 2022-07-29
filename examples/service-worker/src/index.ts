import { createYoga } from 'graphql-yoga'
import { createSchema } from 'graphql-yoga/schema'

// We can define GraphQL Route dynamically using env vars.
declare var GRAPHQL_ROUTE: string

const yoga = createYoga({
  graphqlEndpoint: GRAPHQL_ROUTE || '/graphql',
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        hello: String
      }
    `,
    resolvers: {
      Query: {
        hello: () => 'Hello World!',
      },
    },
  }),
})

self.addEventListener('fetch', yoga)
