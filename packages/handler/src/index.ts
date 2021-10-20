import http from 'http'
import http2 from 'http2'

type RawRequest = http.IncomingMessage | http2.Http2ServerRequest

// https://github.com/graphql/graphql-over-http/blob/a26326b318906a0eaa61f279fa087d0c79cea658/spec/GraphQLOverHTTP.md#content-types
const ACCEPTED_CONTENT_TYPES = ['application/json', 'application/graphql+json']

// https://github.com/graphql/graphql-over-http/blob/a26326b318906a0eaa61f279fa087d0c79cea658/spec/GraphQLOverHTTP.md#request
enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
}

type HandlerRequest = {
  method: RawRequest['method']
  body: {
    query: string
    variables?: Record<string, any>
    operationName?: string
    extensions?: Record<string, any>
  }
  headers: RawRequest['headers']
}

/**
 * Read in body from incoming request
 */
const getBody = (req: RawRequest): Promise<HandlerRequest['body']> => {
  let body = ''
  req.on('data', (chunk) => (body += chunk))
  return new Promise((resolve) =>
    req.on('end', () => resolve(JSON.parse(body))),
  )
}

/**
 * Read url params from incoming request
 */
const getParams = (req: RawRequest): HandlerRequest['body'] => {
  const url = new URL(req.url!, `http://${req.headers.host}`)
  const searchParams = new URLSearchParams(url.search)
  // @ts-expect-error - FIXME: not sure how to type this
  const params = Object.fromEntries(searchParams)

  /**
   * Query must be present.
   * @see https://github.com/graphql/graphql-over-http/blob/a26326b318906a0eaa61f279fa087d0c79cea658/spec/GraphQLOverHTTP.md#request-parameters
   */
  if (!params.query)
    throw new Error(
      'Query not present. You must provide a Document containing GraphQL Operations and Fragments to execute.',
    )
  let body: HandlerRequest['body'] = { query: params.query }
  params.variables && (body.variables = JSON.parse(params.variables))
  params.operationName && (body.operationName = params.operationName)
  params.extensions && (body.extensions = JSON.parse(params.extensions))

  return body
}

export const getRequest = async (req: RawRequest): Promise<HandlerRequest> => {
  const contentType = req.headers['content-type'] || ''
  let body: HandlerRequest['body'] | null = null

  switch (req.method) {
    case HttpMethod.GET:
      body = getParams(req)
      return {
        body,
        headers: req.headers,
        method: req.method,
      }
    case HttpMethod.POST:
      /**
       * Check incoming request for content-type to determine if it conforms to GraphQL over HTTP spec
       * @see https://github.com/graphql/graphql-over-http/blob/a26326b318906a0eaa61f279fa087d0c79cea658/spec/GraphQLOverHTTP.md#post
       */
      if (!ACCEPTED_CONTENT_TYPES.includes(contentType)) {
        throw new Error(
          `Unsupported content type. Provide one of ${ACCEPTED_CONTENT_TYPES.toString()}`,
        )
      }
      body = await getBody(req)
      return {
        body,
        headers: req.headers,
        method: req.method,
      }
    default:
      throw new Error(`Unsupported HTTP method: ${req.method}`)
  }
}
