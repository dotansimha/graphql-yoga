import {
  processRequest,
  getGraphQLParameters,
  shouldRenderGraphiQL,
  renderGraphiQL,
} from '@ardatan/graphql-helix'
import { BaseGraphQLServer, GraphQLServerCORSOptions } from '@graphql-yoga/core'
import { Request, Response } from 'cross-undici-fetch'

export function handleOptions(
  request: Request,
  corsFactory: (request: Request) => GraphQLServerCORSOptions,
) {
  const corsOptions = corsFactory(request)
  const headers: HeadersInit = {}
  if (corsOptions.origin) {
    headers['Access-Control-Allow-Origin'] = corsOptions.origin.join(', ')
  }

  if (corsOptions.methods) {
    headers['Access-Control-Allow-Methods'] = corsOptions.methods.join(', ')
  }

  if (corsOptions.allowedHeaders) {
    headers['Access-Control-Allow-Headers'] =
      corsOptions.allowedHeaders.join(', ')
  }

  if (corsOptions.exposedHeaders) {
    headers['Access-Control-Expose-Headers'] =
      corsOptions.exposedHeaders.join(', ')
  }

  if (corsOptions.credentials) {
    headers['Access-Control-Allow-Credentials'] = 'true'
  }

  if (corsOptions.maxAge) {
    headers['Access-Control-Max-Age'] = corsOptions.maxAge.toString()
  }

  return new Response(null, {
    headers,
    status: corsOptions.optionsSuccessStatus,
  })
}

export const handleRequest = async (
  request: Request,
  { getEnveloped, schema, corsOptionsFactory, logger }: BaseGraphQLServer,
) => {
  try {
    if (corsOptionsFactory != null && request.method === 'OPTIONS') {
      return handleOptions(request, corsOptionsFactory)
    }

    if (shouldRenderGraphiQL(request)) {
      return new Response(renderGraphiQL(), {
        headers: {
          'Content-Type': 'text/html',
        },
        status: 200,
      })
    }

    const graphqlParams = await getGraphQLParameters(request)

    if (getEnveloped) {
      const proxy = getEnveloped({ request })
      return processRequest({
        request,
        ...graphqlParams,
        ...proxy,
      })
    }

    return processRequest({
      request,
      schema,
      ...graphqlParams,
    })
  } catch (err: any) {
    logger.error(err.message, err)
    const response = new Response(err.message, {
      status: 500,
      statusText: 'Internal Server Error'
    })
    return response
  }
}
