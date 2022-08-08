import { GraphQLParams } from '../../types.js'
import { parseURLSearchParams } from './utils.js'

export function isGETEventStreamRequest(request: Request) {
  return (
    request.method === 'GET' &&
    !!request.headers.get('accept')?.includes('text/event-stream')
  )
}

export async function parseGETEventStreamRequest(
  request: Request,
): Promise<GraphQLParams> {
  return parseURLSearchParams(request.url)
}
