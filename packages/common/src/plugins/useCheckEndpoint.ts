import { Plugin } from './types'

export function useCheckEndpoint(opts: { endpoint?: string }): Plugin {
  return {
    onRequest({ request, fetchAPI, endResponse }) {
      if (opts.endpoint) {
        const endpointWithoutSlash =
          opts.endpoint[0] === '/' ? opts.endpoint.substr(1) : opts.endpoint
        const baseRequestUrl = request.url.split('?')[0]
        const urlArr = baseRequestUrl.split('/')
        const requestPath = urlArr[urlArr.length - 1]
        if (requestPath !== endpointWithoutSlash) {
          endResponse(
            new fetchAPI.Response(
              `Unable to ${request.method} /${requestPath}`,
              {
                status: 404,
                statusText: 'Not Found',
              },
            ),
          )
        }
      }
    },
  }
}
