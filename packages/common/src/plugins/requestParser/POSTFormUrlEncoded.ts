import { GraphQLParams } from '../../types'
import { parseURLSearchParams } from './utils'

export function isPOSTFormUrlEncodedRequest(request: Request) {
  return (
    request.method === 'POST' &&
    !!request.headers
      .get('content-type')
      ?.startsWith('application/x-www-form-urlencoded')
  )
}

export async function parsePOSTFormUrlEncodedRequest(
  request: Request,
): Promise<GraphQLParams> {
  const requestBody = await request.text()
  return parseURLSearchParams(requestBody)
}
