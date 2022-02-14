import { ExecutionResult, GraphQLError } from 'graphql'
import { ExecutionPatchResult } from './types'
import { ReadableStream, Response } from 'cross-undici-fetch'
import { encodeString } from './encodeString'

export function getRegularResponse(executionResult: ExecutionResult): Response {
  const responseBody = JSON.stringify(executionResult)
  const decodedString = encodeString(responseBody)
  const headersInit: HeadersInit = {
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

  const readableStream = new ReadableStream({
    start(controller) {
      iterator = asyncExecutionResult[Symbol.asyncIterator]()
      controller.enqueue(`---`)
    },
    async pull(controller) {
      const { done, value } = await iterator.next()
      if (value != null) {
        const chunk = JSON.stringify(value)
        const encodedChunk = encodeString(chunk)
        controller.enqueue('\r\n')
        controller.enqueue('Content-Type: application/json; charset=utf-8\r\n')
        controller.enqueue(
          'Content-Length: ' + encodedChunk.byteLength + '\r\n',
        )
        controller.enqueue('\r\n')
        controller.enqueue(encodedChunk)
        if (value.hasNext) {
          controller.enqueue('\r\n---')
        }
      }
      if (done) {
        controller.enqueue('\r\n-----\r\n')
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
): Response {
  const headersInit: HeadersInit = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
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
        controller.enqueue(`data: ${chunk}\n\n`)
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
  headers?: any
  errors: GraphQLError[]
  isEventStream: boolean
}

async function* getSingleResult(payload: any) {
  yield payload
}

export function getErrorResponse({
  status = 500,
  headers = {},
  errors,
  isEventStream,
}: ErrorResponseParams): Response {
  const payload: ExecutionResult = {
    errors,
  }
  if (isEventStream) {
    return getPushResponse(getSingleResult(payload))
  }
  return new Response(JSON.stringify(payload), {
    status,
    headers,
  })
}
