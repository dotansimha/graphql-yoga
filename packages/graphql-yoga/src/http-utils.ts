// @denoify-ignore
import type { IncomingMessage, ServerResponse } from 'http'
import { Request } from 'cross-undici-fetch'
import { pipeline, Readable } from 'stream'
import { promisify } from 'util'
import { isAsyncIterable } from '@graphql-tools/utils'

export interface NodeRequest {
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
  }
  return new Request(fullUrl, {
    headers: nodeRequest.headers,
    method: nodeRequest.method,
    body: rawRequest as any,
  })
}

export async function sendNodeResponse(
  responseResult: Response,
  serverResponse: ServerResponse,
): Promise<void> {
  responseResult.headers.forEach((value, name) => {
    serverResponse.setHeader(name, value)
  })
  serverResponse.statusCode = responseResult.status
  serverResponse.statusMessage = responseResult.statusText
  // Some fetch implementations like `node-fetch`, return `Response.body` as Promise
  const responseBody = await (responseResult.body as unknown as Promise<any>)
  if (responseBody.getReader) {
    const reader: ReadableStreamDefaultReader = responseBody.getReader()
    serverResponse.on('close', () => {
      reader.cancel()
    })
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }
      if (value) {
        serverResponse.write(value)
      }
    }
    if (!serverResponse.destroyed) {
      serverResponse.end()
    }
  } else {
    const nodeReadable = Readable.from(responseBody)
    nodeReadable.pipe(serverResponse)
  }
}
