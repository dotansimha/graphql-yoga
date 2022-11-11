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

  if (
    responseInit.status >= 400 &&
    acceptedHeader === 'application/graphql-response+json' &&
    !Array.isArray(executionResult) && // array responses are not defined in the spec, ignore them
    'data' in executionResult &&
    executionResult.errors?.length
  ) {
    // if the data field is present (even if present but null), always respond with 200 for 'application/graphql-response+json'
    // see more: https://graphql.github.io/graphql-over-http/draft/#sel-FANNNFCAACKNz-e
    // and here: https://graphql.github.io/graphql-over-http/draft/#sel-FANNNJCAACKN__I
    responseInit.status = 200
  }

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
