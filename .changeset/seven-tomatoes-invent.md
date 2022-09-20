---
'graphql-yoga': patch
---

Expose readonly `graphqlEndpoint` in `YogaServerInstance`

```ts
const yoga = createYoga({
  /*...*/
})
console.log(yoga.graphqlEndpoint) // /graphql by default
```
