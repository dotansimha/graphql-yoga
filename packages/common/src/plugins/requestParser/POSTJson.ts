import { GraphQLParams } from '../../types'
import { isContentTypeMatch } from './utils'

export function isPOSTJsonRequest(request: Request) {
  return (
    request.method === 'POST' &&
    (isContentTypeMatch(request, 'application/graphql+json') ||
      isContentTypeMatch(request, 'application/json'))
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
