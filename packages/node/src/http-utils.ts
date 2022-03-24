import type { IncomingMessage, ServerResponse } from 'http'
import { Blob, FormData, Request } from 'cross-undici-fetch'
import { Readable } from 'stream'
import type { AddressInfo } from './types'
import { Socket } from 'net'
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
  socket?: Socket
  query?: any
}

function getRequestAddressInfo(
  nodeRequest: NodeRequest,
  defaultAddressInfo: AddressInfo,
): AddressInfo {
  const hostname =
    nodeRequest.hostname ||
    nodeRequest.socket?.localAddress
      ?.split('ffff')
      ?.join('')
      ?.split(':')
      ?.join('') ||
    nodeRequest.headers?.host?.split(':')[0] ||
    defaultAddressInfo.hostname ||
    'localhost'

  const port = nodeRequest.socket?.localPort || defaultAddressInfo.port || 80

  return {
    protocol: (nodeRequest.protocol ||
      defaultAddressInfo.protocol ||
      'http') as 'http',
    hostname,
    endpoint: nodeRequest.url || defaultAddressInfo.endpoint,
    port,
  }
}

function buildFullUrl(addressInfo: AddressInfo) {
  return `${addressInfo.protocol}://${addressInfo.hostname}:${addressInfo.port}${addressInfo.endpoint}`
}

export function getNodeRequest(
  nodeRequest: NodeRequest,
  defaultAddressInfo: AddressInfo,
): Request {
  const rawRequest = nodeRequest.raw || nodeRequest.req || nodeRequest
  const addressInfo = getRequestAddressInfo(rawRequest, defaultAddressInfo)
  let fullUrl = buildFullUrl(addressInfo)
  if (nodeRequest.query) {
    const urlObj = new URL(fullUrl)
    for (const queryName in nodeRequest.query) {
      const queryValue = nodeRequest.query[queryName]
      urlObj.searchParams.set(queryName, queryValue)
    }
  }
  const baseRequestInit: RequestInit = {
    method: nodeRequest.method,
    headers: nodeRequest.headers,
  }

  if (nodeRequest.method !== 'POST') {
    return new Request(fullUrl, baseRequestInit)
  }

  const maybeParsedBody = nodeRequest.body
  if (maybeParsedBody != null) {
    if (
      typeof maybeParsedBody === 'string' ||
      maybeParsedBody instanceof Uint8Array ||
      maybeParsedBody instanceof Blob ||
      maybeParsedBody instanceof FormData ||
      maybeParsedBody instanceof URLSearchParams ||
      isAsyncIterable(maybeParsedBody)
    ) {
      return new Request(fullUrl, {
        ...baseRequestInit,
        body: maybeParsedBody as any,
      })
    }
    const request = new Request(fullUrl, {
      ...baseRequestInit,
    })
    if (!request.headers.get('content-type')?.includes('json')) {
      request.headers.set('content-type', 'application/json')
    }
    return new Proxy(request, {
      get: (target, prop: keyof Request, receiver) => {
        switch (prop) {
          case 'json':
            return async () => maybeParsedBody
          default:
            return Reflect.get(target, prop, receiver)
        }
      },
    })
  }

  return new Request(fullUrl, {
    headers: nodeRequest.headers,
    method: nodeRequest.method,
    body: rawRequest as any,
  })
}

function isReadable(responseBody: any): responseBody is Readable {
  return !!responseBody.pipe
}

export function sendNodeResponse(
  { headers, status, statusText, body }: Response,
  serverResponse: ServerResponse,
) {
  headers.forEach((value, name) => {
    serverResponse.setHeader(name, value)
  })
  serverResponse.statusCode = status
  serverResponse.statusMessage = statusText
  if (body == null) {
    serverResponse.end()
    return Promise.resolve()
  } else {
    const nodeStream = isReadable(body) ? body : Readable.from(body)
    const promise = new Promise<void>((resolve) =>
      nodeStream.once('end', resolve),
    )
    nodeStream.pipe(serverResponse)
    return promise
  }
}
