import { createYoga } from 'graphql-yoga'

// We can define GraphQL Route dynamically using env vars.
declare var GRAPHQL_ROUTE: string

const yoga = createYoga({
  graphqlEndpoint: GRAPHQL_ROUTE || '/graphql',
})

self.addEventListener('fetch', yoga)
