---
'@graphql-yoga/common': minor
---

new option `fetchAPI` has been added;

User can provide a custom Fetch implementation to Yoga like below;

```ts
import { fetch, Request, Response, ReadableStream } from 'my-ponyfill'
createServer({
  fetchAPI: {
    fetch,
    Request,
    Response,
    ReadableStream,
  },
})
```
