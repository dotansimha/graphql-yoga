import { isAsyncIterable } from '@graphql-tools/utils'
import { ExecutionResult } from 'graphql'
import { encodeString } from '../../encodeString.js'
import { FetchAPI } from '../../types.js'
import { ResultProcessorInput } from '../types.js'

export function isRegularResult(
  request: Request,
  result: ResultProcessorInput,
): result is ExecutionResult {
  return !isAsyncIterable(result)
}

export function processRegularResult(
  executionResult: ExecutionResult,
  fetchAPI: FetchAPI,
): Response {
  const responseBody = JSON.stringify(executionResult)
  const decodedString = encodeString(responseBody)
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
