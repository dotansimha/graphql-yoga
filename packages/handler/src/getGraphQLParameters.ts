import { dset } from 'dset'

type GraphQLRequestPayload = {
  operationName?: string
  query?: string
  variables?: Record<string, unknown>
  extensions?: Record<string, unknown>
}

type RequestParser = {
  is: (request: Request) => boolean
  parse: (request: Request) => Promise<GraphQLRequestPayload>
}

export const GETRequestParser: RequestParser = {
  is: (request) => request.method === 'GET',
  parse: async (request) => {
    const url = new URL(request.url)
    const operationName = url.searchParams.get('operationName') || undefined
    const query = url.searchParams.get('query') || undefined
    const variables = url.searchParams.get('variables') || undefined
    const extensions = url.searchParams.get('extensions') || undefined
    return {
      operationName,
      query,
      variables: variables ? JSON.parse(variables) : undefined,
      extensions: extensions ? JSON.parse(extensions) : undefined,
    }
  },
}

export const POSTRequestParser: RequestParser = {
  is: (request) => request.method === 'POST',
  parse: async (request) => {
    const requestBody = await request.json()
    return {
      operationName: requestBody.operationName,
      query: requestBody.query,
      variables: requestBody.variables,
      extensions: requestBody.extensions,
    }
  },
}

export const POSTMultipartFormDataRequestParser: RequestParser = {
  is: (request) =>
    request.method === 'POST' &&
    !!request.headers.get('content-type')?.startsWith('multipart/form-data'),
  parse: async (request) => {
    const requestBody = await request.formData()
    const operationsStr = requestBody.get('operations')?.toString() || '{}'
    const operations = JSON.parse(operationsStr)

    const mapStr = requestBody.get('map')?.toString() || '{}'
    const map = JSON.parse(mapStr)
    for (const fileIndex in map) {
      const file = requestBody.get(fileIndex)
      const [path] = map[fileIndex]
      dset(operations, path, file)
    }

    return {
      operationName: operations.operationName,
      query: operations.query,
      variables: operations.variables,
      extensions: operations.extensions,
    }
  },
}

export function buildGetGraphQLParameters(parsers: Array<RequestParser>) {
  return async function getGraphQLParameters(
    request: Request,
  ): Promise<GraphQLRequestPayload> {
    for (const parser of parsers) {
      if (parser.is(request)) {
        return parser.parse(request)
      }
    }
    return {
      operationName: undefined,
      query: undefined,
      variables: undefined,
      extensions: undefined,
    }
  }
}

export const getGraphQLParameters = buildGetGraphQLParameters([
  GETRequestParser,
  POSTMultipartFormDataRequestParser,
  POSTRequestParser,
])
