// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { createYoga, createSchema } from 'graphql-yoga'
import { NextRequest, NextFetchEvent } from 'next/server'

// Docs: https://vercel.com/docs/concepts/functions/edge-functions

export const config = {
  runtime: 'edge',
}

const yoga = createYoga({
  graphqlEndpoint: '/api/graphql',
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

export default yoga.handleRequest
