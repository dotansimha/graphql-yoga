// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { createYoga, createSchema } from 'graphql-yoga'

import type { NextApiRequest, NextApiResponse } from 'next'
import type { Session } from 'next-auth'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'

export const config = {
  api: {
    // Disable body parsing (required for file uploads)
    bodyParser: false,
  },
}

export default createYoga<
  {
    req: NextApiRequest
    res: NextApiResponse
  },
  {
    session: Session
  }
>({
  context: async ({ req, res }) => {
    return {
      session: await getServerSession(req, res, authOptions),
    }
  },
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type User {
        id: String!
        name: String!
        email: String!
        image: String!
      }

      type Session {
        user: User!
        expires: String!
      }

      type Query {
        session: Session
      }
    `,
    resolvers: {
      Query: {
        session(_source, _args, context) {
          return context.session ?? null
        },
      },
      User: {
        id(source) {
          return source['email']
        },
      },
    },
  }),
  graphiql: {
    defaultQuery: `query Session { session { expires user { id email image } } }`,
  },
  graphqlEndpoint: '/api/graphql',
})
