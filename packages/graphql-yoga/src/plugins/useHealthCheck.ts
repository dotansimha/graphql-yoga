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
  endpoint = '/health',
}: HealthCheckPluginOptions = {}): Plugin {
  let urlPattern: URLPattern
  return {
    onRequest({ endResponse, fetchAPI, url }) {
      urlPattern ||= new fetchAPI.URLPattern({ pathname: endpoint })
      if (url.pathname === endpoint || urlPattern.test(url)) {
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
