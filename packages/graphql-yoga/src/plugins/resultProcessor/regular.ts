import { isAsyncIterable } from '@graphql-tools/utils'
import { ExecutionResult, GraphQLError } from 'graphql'
import { FetchAPI } from '../../types.js'
import { ResultProcessorInput } from '../types.js'

export function isRegularResult(
  request: Request,
  result: ResultProcessorInput,
): boolean {
  if (!isAsyncIterable(result)) {
    const acceptHeader = request.headers.get('accept')
    if (acceptHeader) {
      return acceptHeader.includes('application/json')
    }
    // If there is no header, assume it's a regular result per spec
    return true
  }
  return false
}

export function processRegularResult(
  executionResult: ResultProcessorInput,
  fetchAPI: FetchAPI,
): Response {
  const textEncoder = new fetchAPI.TextEncoder()
  const responseBody = JSON.stringify(executionResult)
  const decodedString = textEncoder.encode(responseBody)
  const headersInit: HeadersInit = {
    'Content-Type': 'application/json',
    'Content-Length': decodedString.byteLength.toString(),
  }
  const responseInit: ResponseInit = {
    headers: headersInit,
    status: 200,
  }
  return new fetchAPI.Response(decodedString, responseInit)
}
