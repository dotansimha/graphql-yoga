import type { Handler } from '@aws-cdk/aws-lambda'
import { createYoga } from 'graphql-yoga'
import { configure } from '@vendia/serverless-express'

const app = createYoga()

export const handler: Handler = configure({
  app,
  log: app.logger,
})
