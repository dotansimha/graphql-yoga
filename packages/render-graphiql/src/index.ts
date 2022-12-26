import type { GraphiQLOptions } from 'graphql-yoga'

import { css, js } from './graphiql.js'

export const renderGraphiQL = (opts?: GraphiQLOptions) => /* HTML */ `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>${opts?.title || 'Yoga GraphiQL'}</title>
      <link
        rel="icon"
        href="https://raw.githubusercontent.com/dotansimha/graphql-yoga/main/website/public/favicon.ico"
      />
      <style>
        ${css}
      </style>
    </head>
    <body id="body" class="no-focus-outline">
      <noscript>You need to enable JavaScript to run this app.</noscript>
      <div id="root"></div>

      <script>
        ${js}
        YogaGraphiQL.renderYogaGraphiQL(
          window.document.querySelector('#root'),
          ${JSON.stringify(opts ?? {})},
        )
      </script>
    </body>
  </html>
`
