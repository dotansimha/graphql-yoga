import { YogaLogger } from '../logger.js'
import { Plugin } from './types.js'

export interface HealthCheckPluginOptions {
  id?: string
  logger?: YogaLogger
  endpoint?: string
}

export function useHealthCheck({
  id = Date.now().toString(),
  logger = console,
  endpoint: optsEndpoint,
}: HealthCheckPluginOptions = {}): Plugin {
  // No need to create a URLPattern if we have a static endpoint
  // Later we can remove URLPattern here completely and stop accepting a pattern
  let urlPattern: URLPattern | undefined
  let endpoint: string
  return {
    onYogaInit({ yoga }) {
      if (optsEndpoint) {
        endpoint = optsEndpoint
        urlPattern = new yoga.fetchAPI.URLPattern({ pathname: optsEndpoint })
      } else {
        endpoint = '/health'
      }
    },
    onRequest({ endResponse, fetchAPI, url }) {
      if (url.pathname === endpoint || urlPattern?.test(url)) {
        logger.debug('Responding Health Check')
        const response = new fetchAPI.Response(null, {
          status: 200,
          headers: {
            'x-yoga-id': id,
          },
        })
        endResponse(response)
      }
    },
  }
}
