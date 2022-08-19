import { GraphQLParams } from '../../types.js'

export function isPOSTJsonRequest(request: Request) {
  return request.method === 'POST'
}

export async function parsePOSTJsonRequest(
  request: Request,
): Promise<GraphQLParams> {
  const requestBody = await request.json()
  return {
    operationName: requestBody.operationName,
    query: requestBody.query,
    variables: requestBody.variables,
    extensions: requestBody.extensions,
  }
}
