import { GraphQLParams } from '../../types'
import { Plugin } from '../types'

export function isGETRequest(request: Request) {
  return request.method === 'GET'
}

export function parseGETRequest(request: Request): GraphQLParams {
  const [, searchParamsStr] = request.url.split('?')
  const searchParams = new URLSearchParams(searchParamsStr)
  const operationName = searchParams.get('operationName') || undefined
  const query = searchParams.get('query') || undefined
  const variables = searchParams.get('variables') || undefined
  const extensions = searchParams.get('extensions') || undefined
  return {
    operationName,
    query,
    variables: variables ? JSON.parse(variables) : undefined,
    extensions: extensions ? JSON.parse(extensions) : undefined,
  }
}

export function useGETRequestParser(): Plugin {
  return {
    onRequestParse: async ({ request, setRequestParser }) => {
      if (isGETRequest(request)) {
        setRequestParser(parseGETRequest)
      }
    },
  }
}
