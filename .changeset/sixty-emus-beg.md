---
'@graphql-yoga/node': minor
---

Return Node Server instance from '.start()' method

So you can configure Node Server (e.g. timeout) like below;

```ts
async function main () {
  const nodeServer = await yoga.start();
  nodeServer.setTimeout(15000);
}
```
