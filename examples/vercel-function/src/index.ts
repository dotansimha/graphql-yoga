import { createServer } from '@graphql-yoga/node'
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Docs: https://vercel.com/docs/concepts/functions/serverless-functions

const app = createServer<{
  req: VercelRequest
  res: VercelResponse
}>({
  graphiql: {
    endpoint: '/api/graphql',
  },
})

export default app
