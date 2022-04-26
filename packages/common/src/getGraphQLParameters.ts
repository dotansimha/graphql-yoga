import { PromiseOrValue } from '@envelop/core'
import { dset } from 'dset'
import { Plugin } from './plugins'
import { GraphQLParams } from './types'

export type RequestParser = (request: Request) => PromiseOrValue<GraphQLParams>

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

export function useGETRequestParser(): Plugin {
  return {
    onRequestParse({ request, setRequestParser }) {
      if (request.method === 'GET') {
        setRequestParser(GETRequestParser)
      }
    },
  }
}

async function POSTJSONRequestParser(request: Request): Promise<GraphQLParams> {
  const requestBody = await request.json()
  return {
    operationName: requestBody.operationName,
    query: requestBody.query,
    variables: requestBody.variables,
    extensions: requestBody.extensions,
  }
}

export function usePOSTJSONRequestParser(): Plugin {
  return {
    onRequestParse({ request, setRequestParser }) {
      const contentType =
        request.headers.get('content-type') || 'application/json'
      if (request.method === 'POST' && contentType.includes('json')) {
        setRequestParser(POSTJSONRequestParser)
      }
    },
  }
}

async function POSTMultipartFormDataRequestParser(
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

export function usePOSTMultipartFormDataRequestParser(): Plugin {
  return {
    onRequestParse({ request, setRequestParser }) {
      const contentType = request.headers.get('content-type')
      if (
        request.method === 'POST' &&
        contentType?.startsWith('multipart/form-data')
      ) {
        setRequestParser(POSTMultipartFormDataRequestParser)
      }
    },
  }
}
