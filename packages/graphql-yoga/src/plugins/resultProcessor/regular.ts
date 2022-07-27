import { isAsyncIterable } from '@graphql-tools/utils'
import { ExecutionResult } from 'graphql'
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
