import { GraphQLParams, Plugin } from '@graphql-yoga/common'

async function POSTRequestParser(request: Request): Promise<GraphQLParams> {
  const requestBody = await request.json()
  return {
    operationName: requestBody.operationName,
    query: requestBody.query,
    variables: requestBody.variables,
    extensions: requestBody.extensions,
  }
}

export function usePOSTRequestParser(): Plugin {
  return {
    onRequestParse({ request, setRequestParser }) {
      if (request.method === 'POST') {
        setRequestParser(POSTRequestParser)
      }
    },
  }
}
