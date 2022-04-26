import { isAsyncIterable } from '@envelop/core'
import { ExecutionResult } from 'graphql'
import { encodeString } from '../../encodeString'
import { ExecutionPatchResult, FetchAPI } from '../../types'
import { ResultProcessorInput } from '../types'

export function isMultipartResult(
  request: Request,
  result: ResultProcessorInput,
): result is AsyncIterable<ExecutionPatchResult> {
  return (
    isAsyncIterable(result) &&
    !!request.headers.get('accept')?.includes('multipart/mixed')
  )
}

export function processMultipartResult(
  executionPatchResultIterable: AsyncIterable<ExecutionPatchResult>,
  fetchAPI: Required<FetchAPI>,
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

  const readableStream = new fetchAPI.ReadableStream({
    start(controller) {
      iterator = executionPatchResultIterable[Symbol.asyncIterator]()
      controller.enqueue(encodeString(`---`))
    },
    async pull(controller) {
      const { done, value } = await iterator.next()
      if (value != null) {
        controller.enqueue(encodeString('\r\n'))

        controller.enqueue(
          encodeString('Content-Type: application/json; charset=utf-8'),
        )
        controller.enqueue(encodeString('\r\n'))

        const chunk = JSON.stringify(value)
        const encodedChunk = encodeString(chunk)

        controller.enqueue(
          encodeString('Content-Length: ' + encodedChunk.byteLength),
        )
        controller.enqueue(encodeString('\r\n'))

        controller.enqueue(encodeString('\r\n'))
        controller.enqueue(encodedChunk)
        controller.enqueue(encodeString('\r\n'))

        controller.enqueue(encodeString('---'))
      }
      if (done) {
        controller.enqueue(encodeString('\r\n-----\r\n'))
        controller.close()
      }
    },
    async cancel(e) {
      await iterator.return?.(e)
    },
  })

  return new fetchAPI.Response(readableStream, responseInit)
}
