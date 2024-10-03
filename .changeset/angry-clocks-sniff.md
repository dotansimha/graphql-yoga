---
'@graphql-yoga/subscription': minor
---

Support providing a `RepeaterBuffer` to the `PubSub.subscribe` method, by using the new object based call signature.

```ts
import { createPubSub } from 'graphql-yoga'
import { SlidingBuffer } from '@repeaterjs/repeater'

const pubSub = createPubSub()

pubSub.subscribe({
  topic: "userChanged",
  id: "1",
  buffer: new SlidingBuffer(1_000)
})
```

Learn more about buffers on the [Repeater.js website](https://repeater.js.org/docs/safety#3-buffering-and-dropping-values).
