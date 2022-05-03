---
'@graphql-yoga/common': patch
'@graphql-yoga/node': minor
---

Now you can configure multipart request parsing limits for file uploads with `multipart` option in `createServer` of @graphql-yoga/node
You can also disable `multipart` processing by passing `false`.

```ts
createServer({
  multipart: {
    maxFileSize: 2000, // Default: Infinity
  },
})
```

In `@graphql-yoga/common`'s `createServer`, we can only enable or disable multipart which is enabled by default.

```ts
createServer({
  multipart: false, // enabled by default
})
```
