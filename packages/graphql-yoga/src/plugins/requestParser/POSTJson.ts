import { createGraphQLError } from '@graphql-tools/utils'
import { GraphQLParams } from '../../types.js'
import { isContentTypeMatch } from './utils.js'

export function isPOSTJsonRequest(request: Request) {
  return (
    request.method === 'POST' &&
    (isContentTypeMatch(request, 'application/json') ||
      isContentTypeMatch(request, 'application/graphql+json'))
  )
}

export async function parsePOSTJsonRequest(
  request: Request,
): Promise<GraphQLParams> {
  try {
    const requestBody: any = await request.json()

    if (typeof requestBody !== 'object' || requestBody == null) {
      throw createGraphQLError('POST body sent invalid JSON.', {
        extensions: {
          http: {
            status: 400,
          },
        },
      })
    }

    return requestBody
  } catch (err) {
    throw createGraphQLError('POST body sent invalid JSON.', {
      extensions: {
        http: {
          status: 400,
        },
      },
    })
  }
}
