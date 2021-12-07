import {
  processRequest,
  getGraphQLParameters,
  shouldRenderGraphiQL,
  renderGraphiQL,
} from '@ardatan/graphql-helix'
import { BaseGraphQLServer, GraphQLServerCORSOptions } from '@graphql-yoga/core'
import { DocumentNode } from 'graphql'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
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
  { getEnveloped, schema, corsOptionsFactory }: BaseGraphQLServer,
) => {
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
}

export type GraphQLServerInject<
  TData = any,
  TVariables = Record<string, any>,
  > = {
    /** GraphQL Operation to execute */
    document: string | DocumentNode | TypedDocumentNode<TData, TVariables>
    /** Variables for GraphQL Operation */
    variables?: TVariables
    /** Name for GraphQL Operation */
    operationName?: string
    /** Set any headers for the GraphQL request */
    headers?: HeadersInit
  }

export type TypedResponse<TBody = any> = Omit<Response, 'json'> & {
  json: () => Promise<TBody>
}

export async function injectGraphQLRequest<
  TData = any,
  TVariables = Record<string, any>,
  >(
    {
      handleRequest
    }: BaseGraphQLServer,
    absoluteEndpointUrl: string,
    {
      document,
      variables,
      operationName,
      headers,
    }: GraphQLServerInject<TData, TVariables>,
) {
  const request = new Request(absoluteEndpointUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: document,
      variables,
      operationName,
    }),
  })
  const response = await handleRequest(request)

  return response
}
