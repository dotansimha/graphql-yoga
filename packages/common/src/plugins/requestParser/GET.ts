import { GraphQLParams } from '../../types.js'
import { parseURLSearchParams } from './utils.js'

export function isGETRequest(request: Request) {
  return request.method === 'GET'
}

export function parseGETRequest(request: Request): GraphQLParams {
  const [, searchParamsStr] = request.url.split('?')
  return parseURLSearchParams(searchParamsStr)
}
