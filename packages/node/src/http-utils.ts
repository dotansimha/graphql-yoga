import type { IncomingMessage, ServerResponse } from 'http'
import { Request } from 'cross-undici-fetch'
import { Duplex, PassThrough, Readable, Writable } from 'stream'
import type { AddressInfo } from './types'
import { inspect } from 'util'

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

function getRequestAddressInfo(
  nodeRequest: NodeRequest,
  defaultAddressInfo: AddressInfo,
): AddressInfo {
  const hostnameWithPort =
    nodeRequest.hostname ??
    nodeRequest.headers.host ??
    defaultAddressInfo.hostname
  const [hostname = nodeRequest.hostname, port = defaultAddressInfo.port] =
    hostnameWithPort.split(':')
  return {
    protocol: nodeRequest.protocol ?? defaultAddressInfo.protocol,
    hostname,
    endpoint: nodeRequest.url ?? defaultAddressInfo.endpoint,
    port,
  } as AddressInfo
}

function buildFullUrl(addressInfo: AddressInfo) {
  return `${addressInfo.protocol}://${addressInfo.hostname}:${addressInfo.port}${addressInfo.endpoint}`
}

export async function getNodeRequest(
  nodeRequest: NodeRequest,
  defaultAddressInfo: AddressInfo,
): Promise<Request> {
  const addressInfo = getRequestAddressInfo(nodeRequest, defaultAddressInfo)
  const fullUrl = buildFullUrl(addressInfo)
  const baseRequestInit: RequestInit = {
    method: nodeRequest.method,
    headers: nodeRequest.headers,
  }

  if (nodeRequest.method !== 'POST') {
    return new Request(fullUrl, baseRequestInit)
  }

  const maybeParsedBody = nodeRequest.body
  if (maybeParsedBody) {
    return new Request(fullUrl, {
      ...baseRequestInit,
      body:
        typeof maybeParsedBody === 'string'
          ? maybeParsedBody
          : JSON.stringify(maybeParsedBody),
    })
  }

  const rawRequest = nodeRequest.raw || nodeRequest.req || nodeRequest
  return new Request(fullUrl, {
    headers: nodeRequest.headers,
    method: nodeRequest.method,
    body: rawRequest as any,
  })
}

function isReadableStream(responseBody: any): responseBody is ReadableStream {
  return !!responseBody.getReader
}

function isReadable(responseBody: any): responseBody is Readable {
  return !!responseBody.pipe
}

function isAsyncIterable(
  responseBody: any,
): responseBody is AsyncIterable<any> {
  return !!responseBody[Symbol.asyncIterator]
}

function isIterable(responseBody: any): responseBody is Iterable<any> {
  return !!responseBody[Symbol.iterator]
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
  if (responseBody == null) {
    serverResponse.end()
  } else {
    const nodeStream = getNodeStreamFromResponseBody(responseBody)
    nodeStream.pipe(serverResponse)
    serverResponse.once('close', () => {
      if (!nodeStream.destroyed) {
        nodeStream.destroy()
      }
    })
  }
}

export function getNodeStreamFromResponseBody(responseBody: any): Readable {
  if (isReadable(responseBody)) {
    return responseBody
  }
  const passThrough = new PassThrough()
  if (isReadableStream(responseBody)) {
    const reader = responseBody.getReader()
    void reader
      .read()
      .then(function pump({
        done,
        value,
      }: ReadableStreamDefaultReadResult<Uint8Array>): any {
        if (passThrough.destroyed) {
          reader.releaseLock()
        } else {
          if (value != null) {
            passThrough.write(value)
          }
          if (done) {
            passThrough.end()
            reader.releaseLock()
          } else {
            return reader.read().then(pump)
          }
        }
      })
  } else if (isAsyncIterable(responseBody)) {
    const iterator = responseBody[Symbol.asyncIterator]()
    void iterator
      .next()
      .then(function pump({ done, value }: IteratorResult<any>): any {
        if (passThrough.destroyed) {
          return iterator.return?.()
        } else {
          if (value != null) {
            passThrough.write(value)
          }
          if (done) {
            passThrough.end()
            return iterator.return?.()
          } else {
            return iterator.next().then(pump)
          }
        }
      })
  } else if (isIterable(responseBody)) {
    process.nextTick(() => {
      passThrough.write(responseBody)
      passThrough.end()
    })
  }
  return passThrough
}
