import { ExecutionResult } from 'graphql'
import { isAsyncIterable } from '@envelop/core'

import { getResponseInitByRespectingErrors } from '../../error.js'
import { FetchAPI, MaybeArray } from '../../types.js'
import { ResultProcessorInput } from '../types.js'
import { jsonStringifyResult } from './stringify.js'

export function processPushResult(
  result: ResultProcessorInput,
  fetchAPI: FetchAPI,
): Response {
  const headersInit = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
    'Content-Encoding': 'none',
  }

  const responseInit = getResponseInitByRespectingErrors(result, headersInit)

  let iterator: AsyncIterator<MaybeArray<ExecutionResult>>

  const textEncoder = new fetchAPI.TextEncoder()
  const readableStream = new fetchAPI.ReadableStream({
    start() {
      if (isAsyncIterable(result)) {
        iterator = result[Symbol.asyncIterator]()
      } else {
        let finished = false
        iterator = {
          next: () => {
            if (finished) {
              return Promise.resolve({ done: true, value: null })
            }
            finished = true
            return Promise.resolve({ done: false, value: result })
          },
        }
      }
    },
    async pull(controller) {
      const { done, value } = await iterator.next()
      if (value != null) {
        const chunk = jsonStringifyResult(value)
        controller.enqueue(textEncoder.encode(`data: ${chunk}\n\n`))
      }
      if (done) {
        controller.close()
      }
    },
    async cancel(e) {
      await iterator.return?.(e)
    },
  })
  return new fetchAPI.Response(readableStream, responseInit)
}
