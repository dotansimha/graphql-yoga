import { createYoga } from 'graphql-yoga'
import { createServer } from 'http'

// 1. Please add the operations that causes your issue here
const defaultQuery = /* GraphQL */ `
  query HelloWorld {
    __typename
  }
`

// 2. Please adjust the createYoga setup for the issue you are experiencing
const yoga = createYoga({
  graphiql: {
    defaultQuery,
  },
})

const server = createServer(yoga)
server.listen(4000)
