---
'@graphql-yoga/common': patch
---

Send specific origin in CORS instead of wildcard if credentials are allowed explicitly like below;

```ts
createServer({
  cors: {
    origin: ['http://localhost:4000'], // Previously this was ignored even if `credentials` is true
    credentials: true,
  },
})
```
