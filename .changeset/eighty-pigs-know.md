---
'@graphql-yoga/subscription': minor
---

Support returning a `Promise` from the `filter` utility function.

```ts
const applyFilter = filter((value) => Promise.resolve(value > 3))
```
