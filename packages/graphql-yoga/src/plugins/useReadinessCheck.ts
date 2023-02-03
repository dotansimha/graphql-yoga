import { FetchAPI } from '../types.js'
import { Plugin } from './types.js'

export interface ReadinessCheckPluginOptions {
  /**
   * Under which endpoint do you want the readiness check to be?
   *
   * @default /ready
   */
  endpoint?: string
  /**
   * The check for whether the service is ready to perform.
   *
   * You should check here whether the services Yoga depends on
   * are ready and working, for example: is the database up and running?
   *
   * - Returning `true` or nothing will respond with a 200 OK.
   * - Returning `false` or throwing an error will respond with a 503 Service Unavailable.
   * - Returning a `Response` will have the readiness check respond with it.
   *
   * Beware that if an instance of `Error` is thrown, its message will be present in the
   * response body. Be careful which information you expose.
   */
  check: (payload: {
    request: Request
    fetchAPI: FetchAPI
  }) => void | boolean | Response | Promise<void | boolean | Response>
}

/**
 * Adds a readiness check for Yoga by simply implementing the `check` option.
 */
export function useReadinessCheck({
  endpoint = '/ready',
  check,
}: ReadinessCheckPluginOptions): Plugin {
  let urlPattern: URLPattern
  return {
    async onRequest({ request, endResponse, fetchAPI, url }) {
      urlPattern ||= new fetchAPI.URLPattern({ pathname: endpoint });
      if (url.pathname === endpoint || urlPattern.test(url)) {
        let response: Response
        try {
          const readyOrResponse = await check({ request, fetchAPI })
          if (typeof readyOrResponse === 'object') {
            response = readyOrResponse
          } else {
            response = new fetchAPI.Response(null, {
              status: readyOrResponse === false ? 503 : 200,
            })
          }
        } catch (err) {
          const isError = err instanceof Error
          response = new fetchAPI.Response(isError ? err.message : null, {
            status: 503,
            headers: isError
              ? { 'content-type': 'text/plain; charset=utf-8' }
              : {},
          })
        }
        endResponse(response)
      }
    },
  }
}
