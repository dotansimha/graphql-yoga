import { GraphQLParams } from '../../types.js'
import { isContentTypeMatch } from './utils.js'

export function isPOSTGraphQLStringRequest(request: Request) {
  return request.method === 'POST' && isContentTypeMatch(request, 'application/graphql')
}

export async function parsePOSTGraphQLStringRequest(request: Request): Promise<GraphQLParams> {
  const requestBody = await request.text()
  return {
    query: requestBody,
  }
}
