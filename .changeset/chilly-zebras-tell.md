---
'@graphql-yoga/common': minor
---

Deprecate `.start` and `.stop` in favor of more clear usage for Service Workers API which is used by Cloudflare Workers.
Now Yoga implements `EventListenerObject` which has a `handleEvent` method that is an event listener function.

NOTE: `.start` and `.stop` are going to be deprecated in the next major release.

```ts
import { createServer } from '@graphql-yoga/common'

const yoga = createServer({
  //...
})

//Before: yoga.start();
self.addEventListener('fetch', yoga)

//Before: yoga.stop();
self.removeEventListener('fetch', yoga)
```
