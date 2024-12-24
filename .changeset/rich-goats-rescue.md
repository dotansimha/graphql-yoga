---
'@graphql-yoga/plugin-jwt': patch
---

- Do not throw when \`request\` is not available in the context, it can be a WebSockets connection
- Export helper `extractFromConnectionParams` to get the token from WebSocket `connectionParams` when GraphQL WS is used

```ts
import { extractFromConnectionParams, extractFromHeader, useJWT } from '@graphql-yoga/plugin-jwt'

const yoga = createYoga({
  // ...
  plugins: [
    useJWT({
      // So it will look for the token in the connectionParams.my-token field in case of a WebSockets connection
      // It will check WS params and headers, and get the available one
      lookupLocations: [
        extractFromConnectionParams({ name: 'my-token' }), 
        extractFromHeader({ name: 'authorization', prefix: 'Bearer ' })
      ]
    })
  ]
})
```
