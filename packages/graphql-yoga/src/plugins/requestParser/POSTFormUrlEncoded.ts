import { GraphQLParams } from '../../types.js'
import { isContentTypeMatch, parseURLSearchParams } from './utils.js'

export function isPOSTFormUrlEncodedRequest(request: Request) {
  return (
    request.method === 'POST' &&
    isContentTypeMatch(request, 'application/x-www-form-urlencoded')
  )
}

export async function parsePOSTFormUrlEncodedRequest(
  request: Request,
): Promise<GraphQLParams> {
  const requestBody = await request.text()
  return parseURLSearchParams(requestBody)
}
