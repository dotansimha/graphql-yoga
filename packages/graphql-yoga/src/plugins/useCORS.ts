import { PromiseOrValue } from '@envelop/core'
import { Plugin } from './types.js'

export type CORSOptions =
  | {
      origin?: string[] | string
      methods?: string[]
      allowedHeaders?: string[]
      exposedHeaders?: string[]
      credentials?: boolean
      maxAge?: number
    }
  | false

export type CORSPluginOptions<TServerContext> =
  | CORSOptionsFactory<TServerContext>
  | CORSOptions
  | boolean

export type CORSOptionsFactory<TServerContext> = (
  request: Request,
  // eslint-disable-next-line @typescript-eslint/ban-types
  ...args: {} extends TServerContext
    ? [serverContext?: TServerContext | undefined]
    : [serverContext: TServerContext]
) => PromiseOrValue<CORSOptions>

export function getCORSHeadersByRequestAndOptions(
  request: Request,
  corsOptions: CORSOptions,
): Record<string, string> {
  const headers: Record<string, string> = {}

  if (corsOptions === false) {
    return headers
  }

  // If defined origins have '*' or undefined by any means, we should allow all origins
  if (
    corsOptions.origin == null ||
    corsOptions.origin.length === 0 ||
    corsOptions.origin.includes('*')
  ) {
    const currentOrigin = request.headers.get('origin')
    // If origin is available in the headers, use it
    if (currentOrigin != null) {
      headers['Access-Control-Allow-Origin'] = currentOrigin
      // Vary by origin because there are multiple origins
      headers['Vary'] = 'Origin'
    } else {
      headers['Access-Control-Allow-Origin'] = '*'
    }
  } else if (typeof corsOptions.origin === 'string') {
    // If there is one specific origin is specified, use it directly
    headers['Access-Control-Allow-Origin'] = corsOptions.origin
  } else if (Array.isArray(corsOptions.origin)) {
    // If there is only one origin defined in the array, consider it as a single one
    if (corsOptions.origin.length === 1) {
      headers['Access-Control-Allow-Origin'] = corsOptions.origin[0]
    } else {
      const currentOrigin = request.headers.get('origin')
      if (currentOrigin != null && corsOptions.origin.includes(currentOrigin)) {
        // If origin is available in the headers, use it
        headers['Access-Control-Allow-Origin'] = currentOrigin
        // Vary by origin because there are multiple origins
        headers['Vary'] = 'Origin'
      } else {
        // There is no origin found in the headers, so we should return null
        headers['Access-Control-Allow-Origin'] = 'null'
      }
    }
  }

  if (corsOptions.methods?.length) {
    headers['Access-Control-Allow-Methods'] = corsOptions.methods.join(', ')
  } else {
    const requestMethod = request.headers.get('access-control-request-method')
    if (requestMethod) {
      headers['Access-Control-Allow-Methods'] = requestMethod
    }
  }

  if (corsOptions.allowedHeaders?.length) {
    headers['Access-Control-Allow-Headers'] =
      corsOptions.allowedHeaders.join(', ')
  } else {
    const requestHeaders = request.headers.get('access-control-request-headers')
    if (requestHeaders) {
      headers['Access-Control-Allow-Headers'] = requestHeaders
      if (headers['Vary']) {
        headers['Vary'] += ', Access-Control-Request-Headers'
      }
      headers['Vary'] = 'Access-Control-Request-Headers'
    }
  }

  if (corsOptions.credentials != null) {
    if (corsOptions.credentials === true) {
      headers['Access-Control-Allow-Credentials'] = 'true'
    }
  } else if (headers['Access-Control-Allow-Origin'] !== '*') {
    headers['Access-Control-Allow-Credentials'] = 'true'
  }

  if (corsOptions.exposedHeaders) {
    headers['Access-Control-Expose-Headers'] =
      corsOptions.exposedHeaders.join(', ')
  }

  if (corsOptions.maxAge) {
    headers['Access-Control-Max-Age'] = corsOptions.maxAge.toString()
  }

  return headers
}

async function getCORSResponseHeaders<TServerContext>(
  request: Request,
  corsOptionsFactory: CORSOptionsFactory<TServerContext>,
  serverContext: TServerContext,
) {
  const corsOptions = await corsOptionsFactory(request, serverContext)

  return getCORSHeadersByRequestAndOptions(request, corsOptions)
}

export function useCORS<TServerContext>(
  options?: CORSPluginOptions<TServerContext>,
  // eslint-disable-next-line @typescript-eslint/ban-types
): Plugin<{}, TServerContext> {
  let corsOptionsFactory: CORSOptionsFactory<TServerContext> = () => ({})
  if (options != null) {
    if (typeof options === 'function') {
      corsOptionsFactory = options
    } else if (typeof options === 'object') {
      const corsOptions = {
        ...options,
      }
      corsOptionsFactory = () => corsOptions
    } else if (options === false) {
      corsOptionsFactory = () => false
    }
  }
  return {
    async onRequest({ request, serverContext, fetchAPI, endResponse }) {
      if (request.method.toUpperCase() === 'OPTIONS') {
        const headers = await getCORSResponseHeaders<any>(
          request,
          corsOptionsFactory,
          serverContext,
        )
        const response = new fetchAPI.Response(null, {
          status: 204,
          headers,
        })
        endResponse(response)
      }
    },
    async onResponse({ request, serverContext, response }) {
      const headers = await getCORSResponseHeaders<any>(
        request,
        corsOptionsFactory,
        serverContext,
      )
      for (const headerName in headers) {
        response.headers.set(headerName, headers[headerName])
      }
    },
  }
}
