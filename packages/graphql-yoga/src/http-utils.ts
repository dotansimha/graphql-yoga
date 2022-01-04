// @denoify-ignore
import type { IncomingMessage, ServerResponse } from 'http'
import type { Http2ServerResponse } from 'http2'
import { Request, ReadableStream } from 'cross-undici-fetch'
import { isAsyncIterable } from '@graphql-tools/utils'
import { Readable } from 'stream'

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
    return new Request(fullUrl, {
      headers: nodeRequest.headers,
      method: nodeRequest.method,
      body:
        typeof maybeParsedBody === 'string'
          ? maybeParsedBody
          : JSON.stringify(maybeParsedBody),
    })
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
  const responseBody = await (responseResult.body as unknown as Promise<any>)
  if (responseBody != null) {
    const nodeReadable =
      'pipe' in responseBody ? responseBody : Readable.from(responseBody)
    nodeReadable.pipe(serverResponse)
  }
}
