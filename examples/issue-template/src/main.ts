import { createServer } from '@graphql-yoga/node'

// 1. Please add the operations that causes your issue here
const defaultQuery = /* GraphQL */ `
  query HelloWorld {
    __typename
  }
`

// 2. Please adjust the createServer setup for the issue you are experiencing
const server = createServer({
  graphiql: {
    defaultQuery,
  },
})

server.start()
