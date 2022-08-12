import { GraphQLParams } from '../types.js'

export function parseURLSearchParams(search: string): GraphQLParams {
  const searchParams = new URLSearchParams(search)
  const operationName = searchParams.get('operationName') || undefined
  const query = searchParams.get('query') || undefined
  const variablesStr = searchParams.get('variables') || undefined
  const extensionsStr = searchParams.get('extensions') || undefined
  return {
    operationName,
    query,
    variables: variablesStr ? JSON.parse(variablesStr) : undefined,
    extensions: extensionsStr ? JSON.parse(extensionsStr) : undefined,
  }
}

export function isContentTypeMatch(
  request: Request,
  expectedContentType: string,
): boolean {
  const contentType = request.headers.get('content-type')
  return (
    contentType === expectedContentType ||
    !!contentType?.startsWith(`${expectedContentType};`)
  )
}
