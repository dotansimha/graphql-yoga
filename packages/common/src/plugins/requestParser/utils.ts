import { memoize1 } from '@graphql-tools/utils'
import { GraphQLParams } from '../../types'

export function parseURLSearchParams(requestBody: string): GraphQLParams {
  const searchParams = new URLSearchParams(requestBody)
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

const getContentType = memoize1(function getContentType(request: Request) {
  return request.headers.get('content-type')
})

export function isContentTypeMatch(
  request: Request,
  expectedContentType: string,
): boolean {
  const contentType = getContentType(request)
  return (
    contentType === expectedContentType ||
    !!contentType?.startsWith(`${expectedContentType};`)
  )
}
