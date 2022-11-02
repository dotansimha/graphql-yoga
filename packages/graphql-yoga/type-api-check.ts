/* eslint-disable @typescript-eslint/ban-types */
import { IResolvers } from '@graphql-tools/utils'
import { ClientRequest } from 'http'

import { createYoga, createSchema, YogaInitialContext } from './src/index.js'
import type { GraphQLSchema } from 'graphql'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const schema: GraphQLSchema = null as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const request: Request = null as any

/**
 * TServerContext
 */

// none results in optional context
{
  const server = createYoga<{}>({
    schema,
  })
  server.handleRequest(request, {})
}

// some results in mandatory context (error)

{
  const server = createYoga<{ req: ClientRequest }>({
    schema,
  })
  // @ts-expect-error Arguments for the rest parameter 'serverContext' were not provided.
  server.handleRequest(request)
}

// some results in mandatory context (success)
{
  const server = createYoga<{ req: ClientRequest }>({
    schema,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientRequest: ClientRequest = null as any
  server.handleRequest(request, { req: clientRequest })
}

/**
 * Context + Resolvers
 */

// context can be accessed from within resolvers
{
  createYoga<{ iAmHere: 1 }>({
    schema: createSchema({
      typeDefs: ``,
      resolvers: {
        Query: {
          foo: (_: unknown, __: unknown, context) => {
            context.iAmHere
          },
        },
      },
    }),
  })
}

// context can be accessed from within resolvers
{
  createYoga<{}>({
    schema: createSchema({
      typeDefs: ``,
      resolvers: {
        Query: {
          foo: (_: unknown, __: unknown, context) => {
            // @ts-expect-error Property 'iAmHere' does not exist on type 'YogaInitialContext'.ts(2339)
            context.iAmHere
          },
        },
      },
    }),
  })
}

// context can be accessed when defined outside
{
  type Context = {
    brrt: 1
  }

  const resolvers: IResolvers<unknown, YogaInitialContext & Context> = {
    Query: {
      foo: (_: unknown, __: unknown, context) => {
        context.brrt
      },
    },
  }
  const schema = createSchema<Context>({
    typeDefs: ``,
    resolvers,
  })

  createYoga<Context>({
    schema,
  })
}

// inject usage optional serverContext
{
  const server = createYoga<{}>({
    schema,
  })
  server.inject({
    document: `{ __typename }`,
  })
}

// inject usage required serverContext
{
  type Context = {
    brrt: 1
  }

  const server = createYoga<Context>({
    schema,
  })
  // @ts-expect-error Property 'serverContext' is missing in type '{ document: string; }' but required in type '{ serverContext: Context; }
  server.inject({
    document: `{ __typename }`,
  })
}

createYoga({
  graphiql: false,
})

createYoga({
  graphiql: true,
})

createYoga({
  graphiql: () => false,
})

createYoga({
  graphiql: () => true,
})

createYoga({
  graphiql: {},
})

createYoga({
  graphiql: () => ({}),
})
