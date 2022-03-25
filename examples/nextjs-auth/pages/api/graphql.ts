// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { createServer } from '@graphql-yoga/node'
import { NextApiResponse } from 'next'
import { NextApiHandler, NextApiRequest } from 'next'
import { getSession } from 'next-auth/react'
import { Session } from 'next-auth'
import { Readable } from 'stream'

const server = createServer<{
  req: NextApiRequest
  res: NextApiResponse
  session: Session
}>({
  cors: false,
  endpoint: '/api/graphql',
  context: (context) => {
    console.log(context.session)
    return context
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

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
}

const graphqlHandler: NextApiHandler = async (req, res) => {
  const session = await getSession({ req })
  const response = await server.handleIncomingMessage(req, {
    req,
    res,
    session,
  })
  for (const [name, value] of response.headers) {
    res.setHeader(name, value)
  }

  res.status(response.status)
  const nodeStream = Readable.from(response.body!)
  res.send(nodeStream)
}

export default graphqlHandler
