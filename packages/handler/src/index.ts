import http from 'http'
import http2 from 'http2'
import type { FastifyRequest } from 'fastify'
import type { GraphQLSchema } from 'graphql'
import {
  processRequest,
  sendResult,
  getGraphQLParameters,
  shouldRenderGraphiQL,
  renderGraphiQL,
} from 'graphql-helix'
import type { RawResponse, Request } from 'graphql-helix'
import {
  GetEnvelopedFn,
  useEnvelop,
  envelop,
  useSchema,
  enableIf,
} from '@envelop/core'

type RawRequest = http.IncomingMessage | http2.Http2ServerRequest

/**
 * Read in body from incoming request
 */
const getBody = (req: RawRequest): Promise<string> => {
  let body = ''
  req.on('data', (chunk) => (body += chunk))
  return new Promise((resolve) =>
    req.on('end', () => resolve(JSON.parse(body))),
  )
}

/**
 * Read url params from incoming request
 */
const getParams = (req: RawRequest): object => {
  const url = new URL(req.url!, `http://${req.headers.host}`)
  const searchParams = new URLSearchParams(url.search)
  // @ts-expect-error - FIXME: not sure how to type this
  return Object.fromEntries(searchParams)
}

const isHttpRequest = (req: FastifyRequest | RawRequest): req is RawRequest =>
  // @ts-expect-error - Yes body will not be defined for node http request
  req?.body === undefined

/**
 * Helper function to create a GraphQL Helix request object.
 */
export async function getHttpRequest(req: RawRequest): Promise<Request>
export async function getHttpRequest(req: FastifyRequest): Promise<Request>
export async function getHttpRequest(
  req: RawRequest | FastifyRequest,
): Promise<Request> {
  if (!isHttpRequest(req)) {
    return {
      body: req.body,
      headers: req.headers,
      method: req.method,
      query: req.query,
    }
  }
  const body = await getBody(req)
  const params = getParams(req)
  return {
    body,
    headers: req.headers,
    method: req.method!,
    query: params,
  }
}

export const handleRequest = async (
  request: Request,
  response: RawResponse,
  schema: GraphQLSchema,
  customEnvelop?: GetEnvelopedFn<any>,
) => {
  const graphqlParams = getGraphQLParameters(request)

  const getEnvelop = envelop({
    plugins: [
      useSchema(schema),
      enableIf(!!customEnvelop, useEnvelop(customEnvelop!)),
    ],
    enableInternalTracing: true,
  })
  const proxy = getEnvelop({ request })

  if (shouldRenderGraphiQL(request)) {
    response.end(renderGraphiQL())
  } else {
    const result = await processRequest({
      request,
      ...graphqlParams,
      ...proxy,
    })
    sendResult(result, response)
  }
}
