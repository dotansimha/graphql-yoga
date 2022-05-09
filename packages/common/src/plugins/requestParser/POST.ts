import { GraphQLParams } from '../../types'

export function isPOSTRequest(request: Request) {
  return request.method === 'POST'
}

export function parsePOSTRequest(request: Request): Promise<GraphQLParams> {
  return request.json()
}
