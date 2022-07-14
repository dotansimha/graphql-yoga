import { isAsyncIterable } from '@envelop/core'
import { ExecutionResult } from 'graphql'
import { encodeString } from '../../encodeString.js'
import { FetchAPI } from '../../types.js'
import { ResultProcessorInput } from '../types.js'

export function isPushResult(
  request: Request,
  result: ResultProcessorInput,
): result is AsyncIterable<ExecutionResult> {
  return (
    isAsyncIterable(result) &&
    !!request.headers.get('accept')?.includes('text/event-stream')
  )
}

export function processPushResult(
  result: AsyncIterable<ExecutionResult>,
  fetchAPI: FetchAPI,
): Response {
  const headersInit: HeadersInit = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
    'Content-Encoding': 'none',
  }
  const responseInit: ResponseInit = {
    headers: headersInit,
    status: 200,
  }

  let iterator: AsyncIterator<ExecutionResult<any>>

  const readableStream = new fetchAPI.ReadableStream({
    start() {
      iterator = result[Symbol.asyncIterator]()
    },
    async pull(controller) {
      const { done, value } = await iterator.next()
      if (value != null) {
        const chunk = JSON.stringify(value)
        controller.enqueue(encodeString(`data: ${chunk}\n\n`))
      }
      if (done) {
        controller.close()
      }
    },
    // This is never called...
    async cancel(e) {
      await iterator.return?.(e)
    },
  })

  /**
   * Okay for some reason the cancel passed to new fetchAPI.ReadableStream
   * is never called, let's assign it...
   */
  let cancel = readableStream.cancel.bind(readableStream)
  readableStream.cancel = async (e) => {
    await iterator.return?.(e)
    try {
      await cancel(e)
    } catch (err) {
      console.log(err)
    }
  }

  return new fetchAPI.Response(readableStream, responseInit)
}
