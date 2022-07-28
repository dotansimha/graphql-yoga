---
'graphql-yoga': minor
---

Support a schema factory function that runs per request or a promise to be resolved before the first request.

```ts
createYoga({
  schema(request: Request) {
    return getSchemaForToken(request.headers.get('x-my-token'))
  },
})
```

```ts
async function buildSchemaAsync() {
  const typeDefs = await fs.promises.readFile('./schema.graphql', 'utf8')
  const resolvers = await import('./resolvers.js')
  return makeExecutableSchema({ typeDefs, resolvers })
}

createYoga({
  schema: buildSchemaAsync(),
})
```
