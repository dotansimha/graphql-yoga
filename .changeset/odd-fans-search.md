---
'@graphql-yoga/node': patch
---

Use node-fetch by default instead of undici. As discussed in https://github.com/nodejs/undici/issues/1203, `undici`'s fetch implementation has some performance issues compared to `node-fetch` v2.

So Yoga now uses `node-fetch` by default which doesn't affect the existing users. User can configure `cross-undici-fetch` to revert back this behavior;

```ts
import { create } from 'cross-undici-fetch'

createServer({
  fetchAPI: create({ useNodeFetch: false }),
})
```
