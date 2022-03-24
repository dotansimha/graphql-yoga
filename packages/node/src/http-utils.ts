import type { IncomingMessage, ServerResponse } from 'http'
import { Request } from 'cross-undici-fetch'
import { Readable } from 'stream'
import type { AddressInfo } from './types'
import { Socket } from 'net'

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
  const fullUrl = buildFullUrl(addressInfo)
  const baseRequestInit: RequestInit = {
    method: nodeRequest.method,
    headers: nodeRequest.headers,
  }

  if (nodeRequest.method !== 'POST') {
    return new Request(fullUrl, baseRequestInit)
  }

  if (nodeRequest.headers['content-type'].includes('json')) {
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
