import { GraphQLParams } from '../../types'

export function isPOSTJsonRequest(request: Request) {
  return (
    request.method === 'POST' &&
    !!request.headers.get('content-type')?.startsWith('application/json')
  )
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
