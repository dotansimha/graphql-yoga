import type { Handler } from '@aws-cdk/aws-lambda'
import { createYoga } from 'graphql-yoga'
import { createSchema } from 'graphql-yoga/schema'
import { configure } from '@vendia/serverless-express'

const app = createYoga({
  graphqlEndpoint: '/graphql',
  landingPage: false,
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        greetings: String
      }
    `,
    resolvers: {
      Query: {
        greetings: () =>
          'This is the `greetings` field of the root `Query` type',
      },
    },
  }),
})

export const handler: Handler = configure({
  app,
  log: app.logger,
})
