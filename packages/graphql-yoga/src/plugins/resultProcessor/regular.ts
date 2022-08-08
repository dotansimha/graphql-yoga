import { isAsyncIterable } from '@graphql-tools/utils'
import { getResponseInitByRespectingErrors } from '../../error.js'
import { FetchAPI } from '../../types.js'
import { OperationResult } from '../types.js'

const acceptHeaderByResult = new WeakMap<OperationResult, string>()

export function isRegularResult(
  request: Request,
  result: OperationResult,
): boolean {
  if (!isAsyncIterable(result)) {
    const acceptHeader = request.headers.get('accept')
    if (acceptHeader && !acceptHeader.includes('*/*')) {
      if (acceptHeader.includes('application/json')) {
        acceptHeaderByResult.set(result, 'application/json')
        return true
      }
      if (acceptHeader.includes('application/graphql+json')) {
        acceptHeaderByResult.set(result, 'application/graphql+json')
        return true
      }
      // If there is an accept header but this processer doesn't support, reject
      return false
    }
    // If there is no header, assume it's a regular result per spec
    acceptHeaderByResult.set(result, 'application/json')
    return true
  }
  // If it is not an async iterable, it's not a regular result
  return false
}

export function processRegularResult(
  executionResult: OperationResult,
  fetchAPI: FetchAPI,
): Response {
  const contentType = acceptHeaderByResult.get(executionResult)
  const headersInit = {
    'Content-Type': contentType || 'application/json',
  }

  const responseInit = getResponseInitByRespectingErrors(
    executionResult,
    headersInit,
  )

  const textEncoder = new fetchAPI.TextEncoder()
  const responseBody = JSON.stringify(executionResult)
  const decodedString = textEncoder.encode(responseBody)

  headersInit['Content-Length'] = decodedString.byteLength.toString()

  return new fetchAPI.Response(decodedString, responseInit)
}
