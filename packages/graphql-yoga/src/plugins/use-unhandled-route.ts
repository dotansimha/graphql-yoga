import landingPageBody from '../landing-page-html.js';
import { FetchAPI } from '../types.js';
import type { Plugin } from './types.js';

export function useUnhandledRoute(args: {
  graphqlEndpoint: string;
  showLandingPage: boolean;
}): Plugin {
  let urlPattern: URLPattern;
  function getUrlPattern({ URLPattern }: FetchAPI) {
    urlPattern ||= new URLPattern({
      pathname: args.graphqlEndpoint,
    });
    return urlPattern;
  }
  return {
    onRequest({ request, fetchAPI, endResponse, url }) {
      if (
        !request.url.endsWith(args.graphqlEndpoint) &&
        url.pathname !== args.graphqlEndpoint &&
        !getUrlPattern(fetchAPI).test(url)
      ) {
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
          );
          return;
        }

        endResponse(
          new fetchAPI.Response('', {
            status: 404,
            statusText: 'Not Found',
          }),
        );
      }
    },
  };
}
