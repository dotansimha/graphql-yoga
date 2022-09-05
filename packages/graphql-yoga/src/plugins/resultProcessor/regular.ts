import { isAsyncIterable } from '@graphql-tools/utils'
import { getResponseInitByRespectingErrors } from '../../error.js'
import { FetchAPI } from '../../types.js'
import { ResultProcessorInput } from '../types.js'
import { jsonStringifyResult } from './stringify.js'

export function processRegularResult(
  executionResult: ResultProcessorInput,
  fetchAPI: FetchAPI,
  acceptedHeader: string,
): Response {
  if (isAsyncIterable(executionResult)) {
    return new fetchAPI.Response(null, {
      status: 406,
      statusText: 'Not Acceptable',
      headers: {
        accept:
          'application/json; charset=utf-8, application/graphql-response+json; charset=utf-8',
      },
    })
  }

  const headersInit = {
    'Content-Type': acceptedHeader + '; charset=utf-8',
  }

  const responseInit = getResponseInitByRespectingErrors(
    executionResult,
    headersInit,
  )

  if (responseInit.status >= 400 && acceptedHeader === 'application/json') {
    // regular responses accepting 'application/json' are recommended to always respond with 200
    // see more: https://graphql.github.io/graphql-over-http/draft/#sel-EANNLDFAADHCAx5H
    responseInit.status = 200
  }

  const textEncoder = new fetchAPI.TextEncoder()
  const responseBody = jsonStringifyResult(executionResult)
  const decodedString = textEncoder.encode(responseBody)

  headersInit['Content-Length'] = decodedString.byteLength.toString()

  return new fetchAPI.Response(decodedString, responseInit)
}
