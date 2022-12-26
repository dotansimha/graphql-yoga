import { memoize1 } from '@graphql-tools/utils'

import { OpenAPIInstance } from './types.js'

export const getSwaggerUIHTMLForSofa = memoize1(
  function getSwaggerUIHTMLForSofa(openApi: OpenAPIInstance) {
    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta
      name="description"
      content="SwaggerUI"
    />
    <title>SwaggerUI</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui.css" />
  </head>
  <body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-bundle.js" crossorigin></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        spec: ${JSON.stringify(openApi.get())},
        dom_id: '#swagger-ui',
      });
    };
  </script>
  </body>
  </html>
`
  },
)
