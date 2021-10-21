import http from 'http'
import http2 from 'http2'
import { GraphQLSchema } from 'graphql'
import {
  processRequest,
  Request,
  RawResponse,
  sendResult,
  getGraphQLParameters,
} from 'graphql-helix'
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

/**
 * Helper function to create a GraphQL Helix request object from an incoming request.
 */
const getHelixRequest = async (req: RawRequest): Promise<Request> => {
  const body = await getBody(req)
  const query = getParams(req)

  return {
    body,
    headers: req.headers,
    method: req.method!,
    query,
  }
}

export const handleRequest = async (
  req: RawRequest,
  res: RawResponse,
  schema: GraphQLSchema,
  customEnvelop?: GetEnvelopedFn<any>,
) => {
  const request = await getHelixRequest(req)
  const graphqlParams = getGraphQLParameters(request)

  const getEnvelop = envelop({
    plugins: [
      useSchema(schema),
      enableIf(!!customEnvelop, useEnvelop(customEnvelop!)),
    ],
    enableInternalTracing: true,
  })
  const proxy = getEnvelop({ request })

  const response = await processRequest({
    request,
    ...graphqlParams,
    ...proxy,
  })

  sendResult(response, res)
}
