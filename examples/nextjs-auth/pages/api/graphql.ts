// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { createServer } from '@graphql-yoga/node'
import { NextApiRequest, NextApiResponse } from 'next'
import { Session } from 'next-auth'
import { getSession } from 'next-auth/react'

const server = createServer<
  {
    req: NextApiRequest
    res: NextApiResponse
  },
  {
    session: Session
  }
>({
  context: async ({ req }) => {
    return {
      session: await getSession({ req }),
    }
  },
  schema: {
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
  },
  graphiql: {
    defaultQuery: `query Session { session { expires user { id email image } } }`,
  },
})

export default server
