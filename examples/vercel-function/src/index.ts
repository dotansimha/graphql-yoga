import { createServer } from '@graphql-yoga/node'
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Docs: https://vercel.com/docs/concepts/functions/serverless-functions

const app = createServer({
  graphiql: {
    endpoint: '/api/graphql',
  },
})

export default async function (req: VercelRequest, res: VercelResponse) {
  const response = await app.handleIncomingMessage(req, { req, res })
  res.status(response.status)

  response.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })

  res.send(await response.text())
}
