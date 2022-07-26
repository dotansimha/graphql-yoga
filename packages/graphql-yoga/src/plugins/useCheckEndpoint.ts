import { Plugin } from './types'

export function useCheckEndpoint(graphqlEndpoint: string): Plugin {
  return {
    onRequest({ request, fetchAPI, endResponse }) {
      // new URL is slow
      const { pathname: requestPath } = new URL(request.url)
      if (requestPath !== graphqlEndpoint) {
        const errorMessage = `
            <p>Unable to <code>${request.method}</code> <code>${requestPath}</code>
            <hr>
            <strong>GraphQL Endpoint is set to <code>${graphqlEndpoint}</code> now.</strong>
            <strong>So if you expect it to be <code>${requestPath}</code> please add <code>graphqlEndpoint: '${requestPath}'</code> GraphQL Yoga configuration like below.</strong>
            <code>
              createServer({
                schema,
                graphqlEndpoint: '${requestPath}',
              })
            </code>
          `
        endResponse(
          new fetchAPI.Response(errorMessage, {
            status: 404,
            statusText: 'Not Found',
          }),
        )
      }
    },
  }
}
