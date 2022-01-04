import { Response } from 'cross-undici-fetch'

export interface CORSOptions {
  origin: string[]
  methods?: string[]
  allowedHeaders?: string[]
  exposedHeaders?: string[]
  credentials?: boolean
  maxAge?: number
  optionsSuccessStatus?: number
}

export function handleOptions(
  request: Request,
  corsFactory: (request: Request) => CORSOptions,
) {
  const corsOptions = corsFactory(request)
  const headers: HeadersInit = {}
  if (corsOptions.origin) {
    headers['Access-Control-Allow-Origin'] = corsOptions.origin.join(', ')
  }

  if (corsOptions.methods) {
    headers['Access-Control-Allow-Methods'] = corsOptions.methods.join(', ')
  }

  if (corsOptions.allowedHeaders) {
    headers['Access-Control-Allow-Headers'] =
      corsOptions.allowedHeaders.join(', ')
  }

  if (corsOptions.exposedHeaders) {
    headers['Access-Control-Expose-Headers'] =
      corsOptions.exposedHeaders.join(', ')
  }

  if (corsOptions.credentials) {
    headers['Access-Control-Allow-Credentials'] = 'true'
  }

  if (corsOptions.maxAge) {
    headers['Access-Control-Max-Age'] = corsOptions.maxAge.toString()
  }

  return new Response(null, {
    headers,
    status: corsOptions.optionsSuccessStatus,
  })
}
