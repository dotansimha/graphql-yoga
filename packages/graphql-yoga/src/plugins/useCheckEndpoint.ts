import { Plugin } from './types'

export function useCheckEndpoint(graphqlEndpoint: string): Plugin {
  return {
    onRequest({ request, fetchAPI, endResponse }) {
      const endpointWithoutSlash =
        graphqlEndpoint[0] === '/' ? graphqlEndpoint.substr(1) : graphqlEndpoint
      const baseRequestUrl = request.url.split('?')[0]
      const urlArr = baseRequestUrl.split('/')
      const requestPath = urlArr[urlArr.length - 1]
      if (requestPath !== endpointWithoutSlash) {
        endResponse(
          new fetchAPI.Response(`Unable to ${request.method} /${requestPath}`, {
            status: 404,
            statusText: 'Not Found',
          }),
        )
      }
    },
  }
}
