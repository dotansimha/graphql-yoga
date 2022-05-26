import { GraphQLParams } from '../../types'

export function isPOSTGraphQLStringRequest(request: Request) {
  return (
    request.method === 'POST' &&
    !!request.headers.get('content-type')?.startsWith('application/graphql')
  )
}

export async function parsePOSTGraphQLStringRequest(
  request: Request,
): Promise<GraphQLParams> {
  const requestBody = await request.text()
  return {
    query: requestBody,
  }
}
