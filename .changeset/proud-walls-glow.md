---
'@graphql-yoga/common': minor
'@graphql-yoga/node': minor
---

Allow to pass in `graphiql: true` or `graphiql: () => true` as an option to create server.

This change makes it easier to please the TypeScript compiler for setups that disable YogaGraphiQL conditionally (e.g.g based on environment variables).

**Previously you had to write:**

```ts
createServer({
  graphiql: process.env.NODE_ENV === "development" ? {} : false
  // OR
  graphiql: process.env.NODE_ENV === "development" ? undefined : false
});
```

**Now you can write the following:**

```ts
createServer({
  graphiql: process.env.NODE_ENV === 'development',
})
```
