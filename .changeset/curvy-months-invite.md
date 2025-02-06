---
'graphql-yoga': minor
---

## New hook `onOperation`

This new hook is called for each GraphQL operaiton to handle. It allows to replace the
default Yoga operation handler.

Example: Wrap the GraphQL handling pipeline in an `AsyncLocalStorage`

```ts
function myPlugin(): Plugin {
  const context = new AsyncLocalStorage();
  return {
    onOperation({ operationHandler, setOperationHandler }) {
      const store = { foo: 'bar' }
      setOperationHandler((payload) => context.run(store, operationHandler, payload))
   }
}
```