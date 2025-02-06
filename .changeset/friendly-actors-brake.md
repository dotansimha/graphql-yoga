---
'graphql-yoga': minor
---

Now it is possible to replace or wrap the logic how `GraphQLParams` handled;

By default Yoga calls Envelop to handle the parameters, but now you can replace it with your own logic.

Example: Wrap the GraphQL handling pipeline in an `AsyncLocalStorage`

```ts
function myPlugin(): Plugin {
  const context = new AsyncLocalStorage();
  return {
    onParams({ paramsHandler, setParamsHandler }) {
      const store = { foo: 'bar' }
      setParamsHandler(payload => context.run(store, paramsHandler, payload))
   }
}
```