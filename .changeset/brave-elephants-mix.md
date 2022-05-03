---
'@graphql-yoga/common': patch
'@graphql-yoga/node': minor
---

Now you can configure multipart request parsing limits for file uploads with `multipartLimits` option in `createServer` of @graphql-yoga/node

```ts
createServer({
  multipartLimits: {
    maxFileSize: 2000, // Default: Infinity
  },
})
```
