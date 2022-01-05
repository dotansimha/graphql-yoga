import { GraphQLParams } from './types'
import { dset } from 'dset'

export async function getGraphQLParameters(
  request: Request,
): Promise<GraphQLParams> {
  let operationName: string | undefined
  let query: string | undefined
  let variables: any | undefined

  switch (request.method) {
    case 'GET': {
      const url = new URL(request.url)
      operationName = url.searchParams.get('operationName') || undefined
      query = url.searchParams.get('query') || undefined
      variables = url.searchParams.get('variables') || undefined
      break
    }
    case 'POST': {
      const contentType =
        request.headers.get('content-type') || 'application/json'
      if (contentType.startsWith('multipart/form-data')) {
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
        operationName = operations.operationName
        query = operations.query
        variables = operations.variables
      } else {
        const requestBody = await request.json()
        operationName = requestBody?.operationName
        query = requestBody?.query
        variables = requestBody?.variables
      }
      break
    }
  }

  return {
    operationName,
    query,
    variables,
  }
}
