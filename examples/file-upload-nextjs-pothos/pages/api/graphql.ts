import { createYoga } from 'graphql-yoga'
import type { NextApiRequest, NextApiResponse } from 'next'
import { schema } from '../../schema'

export default createYoga<{
  req: NextApiRequest
  res: NextApiResponse
}>({
  schema,
  graphqlEndpoint: '/api/graphql',
  maskedErrors: false,
})
