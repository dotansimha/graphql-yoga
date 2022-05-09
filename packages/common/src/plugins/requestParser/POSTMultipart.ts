import { dset } from 'dset'
import { GraphQLParams } from '../../types'
import { Plugin } from '../types'
import { useRequestParser } from '../useRequestParser'
import { isPOSTRequest } from './POST'

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
  const operationsStr = requestBody.get('operations')?.toString() || '{}'
  const operations = JSON.parse(operationsStr)

  const mapStr = requestBody.get('map')?.toString() || '{}'
  const map = JSON.parse(mapStr)
  for (const fileIndex in map) {
    const file = requestBody.get(fileIndex)
    const [path] = map[fileIndex]
    dset(operations, path, file)
  }

  return {
    operationName: operations.operationName,
    query: operations.query,
    variables: operations.variables,
    extensions: operations.extensions,
  }
}
