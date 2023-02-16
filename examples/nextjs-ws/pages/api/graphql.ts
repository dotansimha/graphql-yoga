// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { createYoga, createSchema } from 'graphql-yoga'
import type { NextApiRequest, NextApiResponse, PageConfig } from 'next'

// Docs: https://vercel.com/docs/concepts/functions/serverless-functions

export const config: PageConfig = {
  api: {
    // Disable body parsing (required for file uploads)
    bodyParser: false,
  },
}

export default createYoga<{
  req: NextApiRequest
  res: NextApiResponse
}>({
  graphqlEndpoint: '/api/graphql',
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        hello: String!
      }
      type Subscription {
        clock: String!
      }
    `,
    resolvers: {
      Query: {
        hello: () => 'world',
      },
      Subscription: {
        clock: {
          async *subscribe() {
            for (let i = 0; i < 5; i++) {
              yield { clock: new Date().toString() }
              await new Promise((resolve) => setTimeout(resolve, 1_000))
            }
          },
        },
      },
    },
  }),
})
