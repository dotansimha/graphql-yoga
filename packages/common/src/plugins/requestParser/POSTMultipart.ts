import objectPath from 'object-path'
import { GraphQLParams } from '../../types'
import { isPOSTRequest } from './POST'

const GRAPHQL_MULTIPART_REQUEST_SPEC_URL =
  'https://github.com/jaydenseric/graphql-multipart-request-spec'

export function isPOSTMultipartRequest(request: Request): boolean {
  return (
    isPOSTRequest(request) &&
    !!request.headers.get('content-type')?.startsWith('multipart/form-data')
  )
}

export async function parsePOSTMultipartRequest(
  request: Request,
): Promise<GraphQLParams> {
  const requestBody = await request.formData()
  const operationsStr = requestBody.get('operations')?.toString()
  if (!operationsStr) {
    throw new Error(
      `Missing "operations" field in the multipart request; see ${GRAPHQL_MULTIPART_REQUEST_SPEC_URL}`,
    )
  }
  const operations = JSON.parse(operationsStr)
  const operationsMap = objectPath(operations)
  const mapStr = requestBody.get('map')?.toString()
  if (!mapStr) {
    throw new Error(
      `Missing "map" field in the multipart request; see ${GRAPHQL_MULTIPART_REQUEST_SPEC_URL}`,
    )
  }
  const map = JSON.parse(mapStr)
  for (const fileIndex in map) {
    const file = requestBody.get(fileIndex)
    const keys = map[fileIndex]
    for (const key of keys) {
      operationsMap.set(key, file)
    }
  }

  return {
    operationName: operations.operationName,
    query: operations.query,
    variables: operations.variables,
    extensions: operations.extensions,
  }
}
