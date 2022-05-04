import { CORSOptions } from './types'

export function getCORSHeadersByRequestAndOptions(
  request: Request,
  corsOptions: CORSOptions,
): Record<string, string> {
  const headers: Record<string, string> = {
    Server: 'GraphQL Yoga',
  }

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
