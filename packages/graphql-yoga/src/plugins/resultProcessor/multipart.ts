import { isAsyncIterable } from '@envelop/core'
import { ExecutionResult } from 'graphql'
import { ExecutionPatchResult, FetchAPI } from '../../types.js'
import { ResultProcessorInput } from '../types.js'

export function isMultipartResult(request: Request): boolean {
  // There should be an explicit accept header for this result type
  return !!request.headers.get('accept')?.includes('multipart/mixed')
}

export function processMultipartResult(
  result: ResultProcessorInput,
  fetchAPI: FetchAPI,
): Response {
  const headersInit: HeadersInit = {
    Connection: 'keep-alive',
    'Content-Type': 'multipart/mixed; boundary="-"',
    'Transfer-Encoding': 'chunked',
  }
  const responseInit: ResponseInit = {
    headers: headersInit,
    status: 200,
  }

  let iterator: AsyncIterator<ExecutionResult<any>>

  const textEncoder = new fetchAPI.TextEncoder()

  const readableStream = new fetchAPI.ReadableStream({
    start(controller) {
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
      controller.enqueue(textEncoder.encode(`---`))
    },
    async pull(controller) {
      const { done, value } = await iterator.next()
      if (value != null) {
        controller.enqueue(textEncoder.encode('\r\n'))

        controller.enqueue(
          textEncoder.encode('Content-Type: application/json; charset=utf-8'),
        )
        controller.enqueue(textEncoder.encode('\r\n'))

        const chunk = JSON.stringify(value)
        const encodedChunk = textEncoder.encode(chunk)

        controller.enqueue(
          textEncoder.encode('Content-Length: ' + encodedChunk.byteLength),
        )
        controller.enqueue(textEncoder.encode('\r\n'))

        controller.enqueue(textEncoder.encode('\r\n'))
        controller.enqueue(encodedChunk)
        controller.enqueue(textEncoder.encode('\r\n'))

        controller.enqueue(textEncoder.encode('---'))
      }
      if (done) {
        controller.enqueue(textEncoder.encode('\r\n-----\r\n'))
        controller.close()
      }
    },
    async cancel(e) {
      await iterator.return?.(e)
    },
  })

  return new fetchAPI.Response(readableStream, responseInit)
}
