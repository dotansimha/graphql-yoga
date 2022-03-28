import { createServer } from '@graphql-yoga/common'

const yoga = createServer({
  graphiql: {
    endpoint: GRAPHQL_ROUTE,
  },
})

yoga.start()
