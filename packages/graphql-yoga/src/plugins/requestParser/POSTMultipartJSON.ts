import { GraphQLParams } from '../../types.js'
import { isContentTypeMatch } from './utils.js'

export function isPOSTMultipartJSONRequest(request: Request): boolean {
  return (
    request.method === 'POST' &&
    isContentTypeMatch(request, 'application/json') &&
    !!request.headers.get('accept')?.includes('multipart/mixed')
  )
}

export async function parsePOSTMultipartJSONRequest(
  request: Request,
): Promise<GraphQLParams> {
  return await request.json()
}
