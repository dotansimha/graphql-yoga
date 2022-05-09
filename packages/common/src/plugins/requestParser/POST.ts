import { GraphQLParams } from '../../types'
import { Plugin } from '../types'
import { useRequestParser } from '../useRequestParser'

export function isPOSTRequest(request: Request) {
  return request.method === 'POST'
}

export async function parsePOSTRequest(
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

export function usePOSTRequestParser(): Plugin {
  return useRequestParser({
    match: isPOSTRequest,
    parse: parsePOSTRequest,
  })
}
