import { createServer } from '@graphql-yoga/node'

// Docs: https://vercel.com/docs/concepts/functions/serverless-functions

const app = createServer({
  graphiql: {
    endpoint: '/api/graphql',
  },
})

export default app
