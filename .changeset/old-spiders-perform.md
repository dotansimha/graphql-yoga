---
'graphql-yoga': minor
---

export the yoga default format error function.

```ts
import { maskError, createYoga } from 'graphql-yoga'

const yoga = createYoga({
  maskedErrors: {
    maskError(error, message, isDev) {
      if (error?.extensions?.code === 'DOWNSTREAM_SERVICE_ERROR') {
        return error
      }

      return maskError(error, message, isDev)
    }
  }
})
```
