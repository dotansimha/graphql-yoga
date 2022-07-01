// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { createServer } from '@graphql-yoga/node'
import type { NextApiRequest, NextApiResponse } from 'next'

export const config = {
  api: {
    // Disable body parsing (required for file uploads)
    bodyParser: false,
  },
}

export default createServer<{
  req: NextApiRequest
  res: NextApiResponse
}>()
