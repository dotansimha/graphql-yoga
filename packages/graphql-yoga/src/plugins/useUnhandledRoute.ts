import landingPageBody from '../landing-page-html.js'
import type { Plugin } from './types.js'

export function useUnhandledRoute(args: {
  graphqlEndpoint: string
  showLandingPage: boolean
}): Plugin {
  let urlPattern: URLPattern
  return {
    onRequest({ request, fetchAPI, endResponse, url }) {
      urlPattern ||= new fetchAPI.URLPattern({ pathname: args.graphqlEndpoint });
      if (url.pathname !== args.graphqlEndpoint && !urlPattern.test(url)) {
        if (
          args.showLandingPage === true &&
          request.method === 'GET' &&
          !!request.headers?.get('accept')?.includes('text/html')
        ) {
          endResponse(
            new fetchAPI.Response(
              landingPageBody
                .replace(/__GRAPHIQL_LINK__/g, args.graphqlEndpoint)
                .replace(/__REQUEST_PATH__/g, url.pathname),
              {
                status: 200,
                statusText: 'OK',
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
