import { createGraphQLError } from '@graphql-tools/utils/typings/errors.js'
import { dset } from 'dset'
import { GraphQLParams, GraphQLYogaError } from '../../types.js'
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
  } catch (e: unknown) {
    // Trick for cross-undici-fetch errors on Node.js
    // TODO: This needs a better solution
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
}
