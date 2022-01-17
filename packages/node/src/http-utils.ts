import type { IncomingMessage, ServerResponse } from 'http'
import { Request, Response } from 'cross-undici-fetch'
import { Readable } from 'stream'
import type { AddressInfo } from './types'

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
