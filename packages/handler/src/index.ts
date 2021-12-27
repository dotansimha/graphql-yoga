import {
  processRequest,
  getGraphQLParameters,
  shouldRenderGraphiQL,
  renderGraphiQL,
  ProcessRequestOptions,
  RenderGraphiQLOptions,
} from '@ardatan/graphql-helix'
import { Server, ServerCORSOptions } from '@graphql-yoga/core'
import { Response } from 'cross-undici-fetch'

export function handleOptions(
  request: Request,
  corsFactory: (request: Request) => ServerCORSOptions,
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

export async function handleRequest<TContext>(
  this: Server<TContext>,
  request: Request,
) {
  try {
    if (this.corsOptionsFactory != null && request.method === 'OPTIONS') {
      return handleOptions(request, this.corsOptionsFactory)
    }

    this.logger.debug(`Checking if GraphiQL Request`)
    if (shouldRenderGraphiQL(request) && this.graphiql) {
      const graphiQLBody = renderGraphiQL(this.graphiql)
      return new Response(graphiQLBody, {
        headers: {
          'Content-Type': 'text/html',
        },
        status: 200,
      })
    }

    this.logger.debug(`Extracting GraphQL Parameters`)
    const graphqlParams = await getGraphQLParameters(request)

    if (this.getEnveloped) {
      const proxy = this.getEnveloped({ request })
      const processRequestOptions: ProcessRequestOptions<any, any> = {
        request,
        ...graphqlParams,
        ...proxy,
      }
      this.logger.debug(`Processing Request by Helix`)
      return await processRequest(processRequestOptions)
    }

    this.logger.debug(`Processing Request by Helix`)
    return await processRequest({
      request,
      schema: this.schema,
      ...graphqlParams,
    })
  } catch (err: any) {
    this.logger.error(err.message, err)
    const response = new Response(err.message, {
      status: 500,
      statusText: 'Internal Server Error',
    })
    return response
  }
}

export type GraphiQLOptions = RenderGraphiQLOptions
export { renderGraphiQL } from '@ardatan/graphql-helix'
