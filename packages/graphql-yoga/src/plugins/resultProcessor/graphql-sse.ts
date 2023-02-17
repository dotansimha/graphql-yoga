import { ExecutionResult } from 'graphql'
import { isAsyncIterable } from '@envelop/core'

import { getResponseInitByRespectingErrors } from '../../error.js'
import { FetchAPI, MaybeArray } from '../../types.js'
import { ResultProcessorInput } from '../types.js'
import { jsonStringifyResultWithoutInternals } from './stringify.js'

export function processGraphQLSSEResult(
  result: ResultProcessorInput,
  fetchAPI: FetchAPI,
): Response {
  // TODO: implement "single connection mode"

  let pingerMs = 12_000

  // for testing the pings, reduce the timeout significantly
  if (globalThis.process?.env?.NODE_ENV === 'test') {
    pingerMs = 10
  }

  const headersInit = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
    'Content-Encoding': 'none',
  }

  const responseInit = getResponseInitByRespectingErrors(
    result,
    headersInit,
    // as per the GraphQL over SSE spec, operation errors must be reported
    // through the stream and the response head should always be 200: OK
    true,
  )

  let iterator: AsyncIterator<MaybeArray<ExecutionResult>>
  let pinger: ReturnType<typeof setInterval>
  const textEncoder = new fetchAPI.TextEncoder()
  const readableStream = new fetchAPI.ReadableStream({
    start(controller) {
      // ping client every 12 seconds to keep the connection alive
      pinger = setInterval(() => {
        if (controller.desiredSize) {
          controller.enqueue(textEncoder.encode(':\n\n'))
        } else {
          // TODO: why disable pinger when no desired size?
          clearInterval(pinger)
        }
      }, pingerMs)

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
        controller.enqueue(
          textEncoder.encode(
            `event: next\ndata: ${jsonStringifyResultWithoutInternals(
              value,
            )}\n\n`,
          ),
        )
      }
      if (done) {
        clearInterval(pinger)
        controller.enqueue(textEncoder.encode('event: complete\n\n'))
        controller.close()
      }
    },
    async cancel(e) {
      clearInterval(pinger)
      await iterator.return?.(e)
    },
  })

  return new fetchAPI.Response(readableStream, responseInit)
}
