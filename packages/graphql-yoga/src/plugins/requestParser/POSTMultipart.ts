import { createGraphQLError } from '@graphql-tools/utils'
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
  let requestBody: FormData
  try {
    requestBody = await request.formData()
  } catch (e) {
    if (
      e instanceof Error &&
      e.message.startsWith('File size limit exceeded: ')
    ) {
      throw createGraphQLError(e.message, {
        extensions: {
          http: {
            status: 413,
          },
        },
      })
    }
    throw e
  }

  const operationsStr = requestBody.get('operations')

  if (!operationsStr) {
    throw createGraphQLError('Missing multipart form field "operations"')
  }

  if (typeof operationsStr !== 'string') {
    throw createGraphQLError(
      'Multipart form field "operations" must be a string',
    )
  }

  let operations: GraphQLParams

  try {
    operations = JSON.parse(operationsStr)
  } catch (err) {
    throw createGraphQLError(
      'Multipart form field "operations" must be a valid JSON string',
    )
  }

  const mapStr = requestBody.get('map')

  if (mapStr != null) {
    if (typeof mapStr !== 'string') {
      throw createGraphQLError('Multipart form field "map" must be a string')
    }

    let map: Record<string, string[]>

    try {
      map = JSON.parse(mapStr)
    } catch (err) {
      throw createGraphQLError(
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
