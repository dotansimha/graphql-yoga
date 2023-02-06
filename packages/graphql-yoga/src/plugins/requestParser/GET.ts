import { GraphQLParams } from '../../types.js'
import { handleURLSearchParams } from './utils.js'

export function isGETRequest(request: Request) {
  return request.method === 'GET'
}

export function parseGETRequest(_request: Request, url: URL): GraphQLParams {
  return handleURLSearchParams(url.searchParams)
}
