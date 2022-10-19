import type { Plugin } from './types'
import landingPageBody from '../landing-page-html.js'

export function useUnhandledRoute(args: {
  graphqlEndpoint: string
  showLandingPage: boolean
}): Plugin {
  return {
    onRequest({ request, fetchAPI, endResponse, url }) {
      const { pathname: requestPath } = url
      if (requestPath !== args.graphqlEndpoint) {
        if (
          args.showLandingPage === true &&
          request.method === 'GET' &&
          !!request.headers?.get('accept')?.includes('text/html')
        ) {
          endResponse(
            new fetchAPI.Response(
              landingPageBody
                .replace(/__GRAPHIQL_LINK__/g, args.graphqlEndpoint)
                .replace(/__REQUEST_PATH__/g, requestPath),
              {
                headers: {
                  'Content-Type': 'text/html',
                },
              },
            ),
          )
          return
        }

        endResponse(
          new fetchAPI.Response('', {
            status: 404,
            statusText: 'Not Found',
          }),
        )
      }
    },
  }
}
