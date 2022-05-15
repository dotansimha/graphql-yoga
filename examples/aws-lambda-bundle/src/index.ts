import { createServer } from '@graphql-yoga/node'
import { configure } from '@vendia/serverless-express'

const app = createServer()

export const handler = configure({
  app,
  log: app.logger,
})
