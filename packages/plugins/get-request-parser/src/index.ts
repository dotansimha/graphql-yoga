import { GraphQLParams, Plugin } from '@graphql-yoga/common'

function GETRequestParser(request: Request): GraphQLParams {
  const [, searchParamsStr] = request.url.split('?')
  const searchParams = new URLSearchParams(searchParamsStr)
  const operationName = searchParams.get('operationName') || undefined
  const query = searchParams.get('query') || undefined
  const variables = searchParams.get('variables') || undefined
  const extensions = searchParams.get('extensions') || undefined
  return {
    operationName,
    query,
    variables: variables ? JSON.parse(variables) : undefined,
    extensions: extensions ? JSON.parse(extensions) : undefined,
  }
}

export function useGETRequestParser<PluginContext>(): Plugin<PluginContext> {
  return {
    onRequestParse({ request, setRequestParser }) {
      if (request.method === 'GET') {
        setRequestParser(GETRequestParser)
      }
    },
  }
}
