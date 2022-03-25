import { ExecutionResult, GraphQLError } from 'graphql'
import { ExecutionPatchResult } from './types'
import { ReadableStream, Response } from 'cross-undici-fetch'
import { encodeString } from './encodeString'

export function getRegularResponse(
  executionResult: ExecutionResult,
  extraHeaders: Record<string, string>,
): Response {
  const responseBody = JSON.stringify(executionResult)
  const decodedString = encodeString(responseBody)
  const headersInit: HeadersInit = {
    ...extraHeaders,
    'Content-Type': 'application/json',
    'Content-Length': decodedString.byteLength.toString(),
  }
  const responseInit: ResponseInit = {
    headers: headersInit,
    status: 200,
  }
  return new Response(decodedString, responseInit)
}

export function getMultipartResponse(
  asyncExecutionResult: AsyncIterable<ExecutionPatchResult<any>>,
  extraHeaders: Record<string, string>,
): Response {
  const headersInit: HeadersInit = {
    ...extraHeaders,
    Connection: 'keep-alive',
    'Content-Type': 'multipart/mixed; boundary="-"',
    'Transfer-Encoding': 'chunked',
  }
  const responseInit: ResponseInit = {
    headers: headersInit,
    status: 200,
  }

  let iterator: AsyncIterator<ExecutionResult<any>>

  const readableStream = new ReadableStream({
    start(controller) {
      iterator = asyncExecutionResult[Symbol.asyncIterator]()
      controller.enqueue(encodeString(`---`))
    },
    async pull(controller) {
      const { done, value } = await iterator.next()
      if (value != null) {
        controller.enqueue(encodeString('\r\n'))
        controller.enqueue(
          encodeString('Content-Type: application/json; charset=utf-8\r\n'),
        )

        const chunk = JSON.stringify(value)
        const encodedChunk = encodeString(chunk)
        controller.enqueue(
          encodeString('Content-Length: ' + encodedChunk.byteLength + '\r\n'),
        )
        controller.enqueue(encodeString('\r\n'))
        controller.enqueue(encodedChunk)
        if (value.hasNext) {
          controller.enqueue(encodeString('\r\n---'))
        }
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

  return new Response(readableStream, responseInit)
}

export function getPushResponse(
  asyncExecutionResult: AsyncIterable<ExecutionResult<any>>,
  extraHeaders: Record<string, string>,
): Response {
  const headersInit: HeadersInit = {
    ...extraHeaders,
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

  const readableStream = new ReadableStream({
    start() {
      iterator = asyncExecutionResult[Symbol.asyncIterator]()
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
    async cancel(e) {
      await iterator.return?.(e)
    },
  })
  return new Response(readableStream, responseInit)
}

interface ErrorResponseParams {
  status?: number
  headers: Record<string, string>
  errors: GraphQLError[]
  isEventStream: boolean
}

async function* getSingleResult(payload: any) {
  yield payload
}

export function getErrorResponse({
  status = 500,
  headers,
  errors,
  isEventStream,
}: ErrorResponseParams): Response {
  const payload: ExecutionResult = {
    data: null,
    errors,
  }
  if (isEventStream) {
    return getPushResponse(getSingleResult(payload), headers)
  }
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  })
}
