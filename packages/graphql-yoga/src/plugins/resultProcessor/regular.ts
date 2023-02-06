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
    acceptedHeader === 'application/json',
  )

  const responseBody = jsonStringifyResult(executionResult)

  return new fetchAPI.Response(responseBody, responseInit)
}
