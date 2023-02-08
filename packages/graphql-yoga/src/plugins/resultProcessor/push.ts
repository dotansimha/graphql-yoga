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
  let timeoutInSeconds = 12

  // for testing the pings, reduce the timeout
  if (globalThis.process?.env?.NODE_ENV === 'test') {
    timeoutInSeconds = 1
  }

  const headersInit = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
    'Content-Encoding': 'none',
  }

  const responseInit = getResponseInitByRespectingErrors(result, headersInit)

  let iterator: AsyncIterator<MaybeArray<ExecutionResult>>

  let pingInterval: number
  const textEncoder = new fetchAPI.TextEncoder()
  const readableStream = new fetchAPI.ReadableStream({
    start(controller) {
      // ping client every 12 seconds to keep the connection alive
      pingInterval = setInterval(() => {
        if (!controller.desiredSize) {
          clearInterval(pingInterval)
          return
        }
        controller.enqueue(textEncoder.encode(':\n\n'))
      }, timeoutInSeconds * 1000) as unknown as number

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
        clearInterval(pingInterval)
        controller.close()
      }
    },
    async cancel(e) {
      clearInterval(pingInterval)
      await iterator.return?.(e)
    },
  })
  return new fetchAPI.Response(readableStream, responseInit)
}
