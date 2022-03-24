import type { Handler } from '@aws-cdk/aws-lambda'
import { createServer } from '@graphql-yoga/node'
import { configure } from '@vendia/serverless-express'

const server = createServer()

export const handler: Handler = configure({
  app: server.requestListener,
  log: server.logger,
})
