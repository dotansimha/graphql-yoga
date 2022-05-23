import { dset } from 'dset'
import { getErrorResponse } from '../../processRequest'
import { FetchAPI, GraphQLParams } from '../../types'
import { isPOSTRequest } from './POST'

export function isPOSTMultipartRequest(request: Request): boolean {
  return (
    isPOSTRequest(request) &&
    !!request.headers.get('content-type')?.startsWith('multipart/form-data')
  )
}

export async function parsePOSTMultipartRequest(
  request: Request,
  fetchAPI: FetchAPI,
): Promise<GraphQLParams | Response> {
  try {
    const requestBody = await request.formData()
    const operationsStr = requestBody.get('operations')?.toString() || '{}'
    const operations = JSON.parse(operationsStr)
    const mapStr = requestBody.get('map')?.toString() || '{}'
    const map = JSON.parse(mapStr)
    for (const fileIndex in map) {
      const file = requestBody.get(fileIndex)
      const keys = map[fileIndex]
      for (const key of keys) {
        dset(operations, key, file)
      }
    }

    return {
      operationName: operations.operationName,
      query: operations.query,
      variables: operations.variables,
      extensions: operations.extensions,
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      return getErrorResponse({
        status: 400,
        errors: [err],
        fetchAPI,
      })
    }
    throw err
  }
}
