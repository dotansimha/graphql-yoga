---
'@graphql-yoga/common': minor
---

new option `fetchAPI` has been added;

User can provide a custom Fetch implementation to Yoga like below;

```ts
import { Fetch } from 'my-ponyfill'
createServer({
  fetchAPI: {
    fetch: fetch,
    Request: Request,
    Response: Response,
    ReadableStream: ReadableStream,
  },
})
```
