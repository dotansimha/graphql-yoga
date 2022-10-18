import { GraphQLError } from '@graphql-tools/graphql'
import { dset } from 'dset'
import { GraphQLParams } from '../../types.js'
import { isContentTypeMatch } from './utils.js'

export function isPOSTMultipartRequest(request: Request): boolean {
  return (
    request.method === 'POST' &&
    isContentTypeMatch(request, 'multipart/form-data')
  )
}

export async function parsePOSTMultipartRequest(
  request: Request,
): Promise<GraphQLParams> {
  const requestBody = await request.formData()

  const operationsStr = requestBody.get('operations')

  if (!operationsStr) {
    throw new GraphQLError('Missing multipart form field "operations"')
  }

  if (typeof operationsStr !== 'string') {
    throw new GraphQLError('Multipart form field "operations" must be a string')
  }

  let operations: GraphQLParams

  try {
    operations = JSON.parse(operationsStr)
  } catch (err) {
    throw new GraphQLError(
      'Multipart form field "operations" must be a valid JSON string',
    )
  }

  const mapStr = requestBody.get('map')

  if (mapStr != null) {
    if (typeof mapStr !== 'string') {
      throw new GraphQLError('Multipart form field "map" must be a string')
    }

    let map: Record<string, string[]>

    try {
      map = JSON.parse(mapStr)
    } catch (err) {
      throw new GraphQLError(
        'Multipart form field "map" must be a valid JSON string',
      )
    }
    for (const fileIndex in map) {
      const file = requestBody.get(fileIndex)
      const keys = map[fileIndex]
      for (const key of keys) {
        dset(operations, key, file)
      }
    }
  }

  return operations
}
