---
'graphql-yoga': minor
---

Customize the landing page by passing a custom renderer that returns `Response` to the `landingPage`
option

```ts
import { createYoga } from 'graphql-yoga'

const yoga = createYoga({
  landingPage: ({ url, fetchAPI }) => {
    return new fetchAPI.Response(
      /* HTML */ `
        <!doctype html>
        <html>
          <head>
            <title>404 Not Found</title>
          </head>
          <body>
            <h1>404 Not Found</h1>
            <p>Sorry, the page (${url.pathname}) you are looking for could not be found.</p>
          </body>
        </html>
      `,
      {
        status: 404,
        headers: {
          'Content-Type': 'text/html'
        }
      }
    )
  }
})
```