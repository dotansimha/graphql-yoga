import { GraphQLParams, Plugin } from '@graphql-yoga/common'
import { dset } from 'dset'

async function POSTMultipartRequestParser(
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

export function usePOSTMultipartRequestParser(): Plugin {
  return {
    onRequestParse({ request, setRequestParser }) {
      if (
        request.method === 'POST' &&
        request.headers.get('content-type')?.startsWith('multipart/form-data')
      ) {
        setRequestParser(POSTMultipartRequestParser)
      }
    },
  }
}
