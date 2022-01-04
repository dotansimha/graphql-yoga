// @denoify-ignore
import type { IncomingMessage, ServerResponse } from 'http'
import type { Http2ServerResponse } from 'http2'
import { Request, ReadableStream } from 'cross-undici-fetch'
import { isAsyncIterable } from '@graphql-tools/utils'

interface NodeRequest {
  protocol?: string
  hostname?: string
  body?: any
  url?: string
  method?: string
  headers: any
  req?: IncomingMessage
  raw?: IncomingMessage
}

export async function getNodeRequest(
  nodeRequest: NodeRequest,
): Promise<Request> {
  const fullUrl = `${nodeRequest.protocol || 'http'}://${
    nodeRequest.hostname || nodeRequest.headers.host || 'localhost'
  }${nodeRequest.url || '/graphql'}`
  const maybeParsedBody = nodeRequest.body
  const rawRequest = nodeRequest.raw || nodeRequest.req || nodeRequest
  if (nodeRequest.method !== 'POST') {
    return new Request(fullUrl, {
      headers: nodeRequest.headers,
      method: nodeRequest.method,
    })
  } else if (maybeParsedBody) {
    const request = new Request(fullUrl, {
      headers: nodeRequest.headers,
      method: nodeRequest.method,
    })
    Object.defineProperties(request, {
      json: {
        value: async () => maybeParsedBody,
      },
      text: {
        value: async () => JSON.stringify(maybeParsedBody),
      },
      body: {
        get: () =>
          new Request(fullUrl, {
            method: 'POST',
            body: JSON.stringify(maybeParsedBody),
          }).body,
      },
    })
    return request
  } else if (isAsyncIterable(rawRequest)) {
    let iterator: AsyncIterator<any>
    const body = new ReadableStream({
      async start() {
        iterator = rawRequest[Symbol.asyncIterator]()
      },
      async pull(controller) {
        const { done, value } = await iterator.next()
        if (done) {
          queueMicrotask(() => {
            controller.close()
          })
        } else {
          controller.enqueue(value)
        }
      },
      async cancel(e) {
        await iterator.return?.(e)
      },
    })
    return new Request(fullUrl, {
      headers: nodeRequest.headers,
      method: nodeRequest.method,
      body,
    })
  }
  throw new Error(`Unknown request`)
}

export type ServerResponseOrHttp2ServerResponse =
  | ServerResponse
  | Http2ServerResponse

export async function sendNodeResponse(
  responseResult: Response,
  serverResponseOrHttp2Response: ServerResponseOrHttp2ServerResponse,
): Promise<void> {
  const serverResponse = serverResponseOrHttp2Response as ServerResponse
  responseResult.headers.forEach((value, name) => {
    serverResponse.setHeader(name, value)
  })
  serverResponse.statusCode = responseResult.status
  serverResponse.statusMessage = responseResult.statusText
  // Some fetch implementations like `node-fetch`, return `Response.body` as Promise
  const responseBody = await (responseResult.body as unknown as Promise<
    ReadableStream<Uint8Array> | AsyncIterable<Uint8Array> | null
  >)
  if (responseBody != null) {
    // If the response body is a NodeJS Readable stream, we can pipe it to the response directly
    if (typeof (responseBody as any).pipe === 'function') {
      ;(responseBody as any).pipe(serverResponse)
    } else {
      // If it is a buffer
      if (responseBody instanceof Uint8Array) {
        serverResponse.write(responseBody)
        // If it is an AsyncIterable
      } else if (isAsyncIterable(responseBody)) {
        for await (const chunk of responseBody) {
          if (chunk) {
            serverResponse.write(chunk)
          }
        }
        // If it is a real ReadableStream
      } else if (typeof responseBody.getReader === 'function') {
        const reader = responseBody.getReader()
        const asyncIterable: AsyncIterable<Uint8Array> = {
          [Symbol.asyncIterator]: () => {
            const reader = responseBody.getReader()
            return {
              next: () => reader.read() as Promise<IteratorResult<Uint8Array>>,
              return: async () => {
                reader.releaseLock()
                return {
                  done: true,
                  value: undefined,
                }
              },
            }
          },
        }
        for await (const chunk of asyncIterable) {
          if (chunk) {
            serverResponse.write(chunk)
          }
        }
        serverResponse.on('close', () => {
          reader.releaseLock()
        })
      }
      serverResponse.end()
    }
  }
}
