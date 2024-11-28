---
'@graphql-yoga/plugin-response-cache': patch
---

Pass \`context\` to `session` and `buildResponseCacheKey`

So now `session` can get the context to use the JWT token extracted by JWT Plugin for instance;

```ts
useResponseCache({
  session: (req, ctx) => ctx.jwt.token,
});
```
