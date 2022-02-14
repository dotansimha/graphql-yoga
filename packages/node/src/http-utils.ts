import type { IncomingMessage, ServerResponse } from 'http'
import { Request } from 'cross-undici-fetch'
import { Readable } from 'stream'
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
    const nodeReadable = getNodeStreamFromResponseBody(responseBody)
    nodeReadable.pipe(serverResponse)
  }
}

export function getNodeStreamFromResponseBody(
  responseBody: any,
): Readable | ReadableStreamAdapterReadable<any> {
  if (isReadable(responseBody)) {
    return responseBody
  }
  if (isReadableStream(responseBody) && 'fromWeb' in responseBody) {
    return (Readable as any).fromWeb(responseBody)
  }
  if (isAsyncIterable(responseBody) || isIterable(responseBody)) {
    return Readable.from(responseBody)
  } else {
    throw new Error(`Unrecognized response body: ${inspect(responseBody)}`)
  }
}
