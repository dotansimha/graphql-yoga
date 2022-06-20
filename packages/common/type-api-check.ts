import { IResolvers } from '@graphql-tools/utils'
import { ClientRequest } from 'node:http'
import { createServer } from './src'

const request: Request = null as any

/**
 * TServerContext
 */

// none results in optional context
{
  const server = createServer<{}>()
  server.handleRequest(request)
}

// some results in mandatory context (error)

{
  const server = createServer<{ req: ClientRequest }>()
  // @ts-expect-error Arguments for the rest parameter 'serverContext' were not provided.
  server.handleRequest(request)
}

// some results in mandatory context (success)
{
  const server = createServer<{ req: ClientRequest }>()
  const clientRequest: ClientRequest = null as any
  server.handleRequest(request, { req: clientRequest })
}

/**
 * Context + Resolvers
 */

// context can be accessed from within resolvers
{
  createServer<{ iAmHere: 1 }>({
    schema: {
      typeDefs: ``,
      resolvers: {
        Query: {
          foo: (_: unknown, __: unknown, context) => {
            context.iAmHere
          },
        },
      },
    },
  })
}

// context can be accessed from within resolvers
{
  createServer<{}>({
    schema: {
      typeDefs: ``,
      resolvers: {
        Query: {
          foo: (_: unknown, __: unknown, context) => {
            // @ts-expect-error Property 'iAmHere' does not exist on type 'YogaInitialContext'.ts(2339)
            context.iAmHere
          },
        },
      },
    },
  })
}

// context can be accessed when defined outside
{
  type Context = {
    brrt: 1
  }

  const resolvers: IResolvers<unknown, Context> = {
    Query: {
      foo: (_: unknown, __: unknown, context) => {
        context.brrt
      },
    },
  }
  createServer<Context>({
    schema: {
      typeDefs: ``,
      resolvers,
    },
  })
}

// inject usage optional serverContext
{
  const server = createServer<{}>()
  server.inject({
    document: `{ __typename }`,
  })
}

// inject usage required serverContext
{
  type Context = {
    brrt: 1
  }

  const server = createServer<Context>()
  // @ts-expect-error Property 'serverContext' is missing in type '{ document: string; }' but required in type '{ serverContext: Context; }
  server.inject({
    document: `{ __typename }`,
  })
}

createServer({
  graphiql: false,
})

createServer({
  graphiql: true,
})

createServer({
  graphiql: () => false,
})

createServer({
  graphiql: () => true,
})

createServer({
  graphiql: {},
})

createServer({
  graphiql: () => ({}),
})
