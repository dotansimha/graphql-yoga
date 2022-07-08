import { createGraphQLError } from '@graphql-tools/utils'
import { YogaLogger } from '../logger.js'
import { Plugin } from './types.js'

export interface HealthCheckPluginOptions {
  id?: string
  logger?: YogaLogger
}

export function useHealthCheck(options?: HealthCheckPluginOptions): Plugin {
  const id = options?.id || Date.now().toString()
  const logger = options?.logger || console
  return {
    async onRequest({ request, endResponse, fetchAPI }) {
      const requestPath = request.url.split('?')[0]
      if (requestPath.endsWith('/health')) {
        logger.debug(`Responding Health Check`)
        const response = new fetchAPI.Response(
          JSON.stringify({
            message: 'alive',
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'x-yoga-id': id,
            },
          },
        )
        endResponse(response)
      } else if (requestPath.endsWith('/readiness')) {
        logger.debug(`Responding Readiness Check`)
        const readinessResponse = await fetchAPI.fetch(
          request.url.replace('/readiness', '/health'),
        )
        const { message } = await readinessResponse.json()
        if (
          readinessResponse.status === 200 &&
          readinessResponse.headers.get('x-yoga-id') === id &&
          message === 'alive'
        ) {
          const response = new fetchAPI.Response(
            JSON.stringify({
              message: 'ready',
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
              },
            },
          )
          endResponse(response)
        } else {
          throw createGraphQLError(
            `Readiness check failed with status ${readinessResponse.status}`,
          )
        }
      }
    },
  }
}
