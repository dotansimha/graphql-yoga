import { FetchAPI, GraphQLParams } from '../../types'

export function isPOSTRequest(request: Request) {
  return request.method === 'POST'
}

export async function parsePOSTRequest(
  request: Request,
  _fetchAPI: FetchAPI,
): Promise<GraphQLParams | Response> {
  const requestBody = await request.json()
  return {
    operationName: requestBody.operationName,
    query: requestBody.query,
    variables: requestBody.variables,
    extensions: requestBody.extensions,
  }
}
