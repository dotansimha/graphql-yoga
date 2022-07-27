import { Plugin } from './types'

export function useCheckEndpoint(graphqlEndpoint: string): Plugin {
  return {
    onRequest({ request, fetchAPI, endResponse }) {
      // new URL is slow
      const { pathname: requestPath } = new URL(request.url)
      if (requestPath !== graphqlEndpoint) {
        const errorMessage = `
        <html>
          <head>
            <title>GraphQL Yoga - 404 Not Found</title>
            <style>
              body {
                font-family: monospace;
                font-size: 12px;
                margin: 10px auto;
                text-align: center;
              }
              code {
                background: #d5d5d5;
                color: brown;
              }
              textarea {
                width: 450px;
              }
            </style>
          </head>
          <body>
            <p>Unable to <code>${request.method}</code> <code>${requestPath}</code>
            <hr>
            <p>GraphQL Endpoint is set to <code>${graphqlEndpoint}</code> now.<p>
            <p>
              So if you expect it to be <code>${requestPath}</code>
              please add <code>graphqlEndpoint: '${requestPath}'</code> to GraphQL Yoga configuration like below;
            </p>
            <textarea readonly rows="10">
              import { createYoga } from 'graphql-yoga';
              import { schema } from './schema.js';
              const yoga = createYoga({
                schema,
                graphqlEndpoint: '${requestPath}',
              })
            </textarea>
          </body>
        </html>
          `
        endResponse(
          new fetchAPI.Response(errorMessage, {
            status: 404,
            statusText: 'Not Found',
            headers: {
              'Content-Type': 'text/html',
            },
          }),
        )
      }
    },
  }
}
