---
'graphql-yoga': minor
---

Experimental support for aborting GraphQL execution when the HTTP request is canceled.

The execution of subsequent GraphQL resolvers is now aborted if the incoming HTTP request is canceled from the client side.
This reduces the load of your API in case incoming requests with deep GraphQL operation selection sets are canceled.

```ts
import { createYoga, useExecutionCancellation } from 'graphql-yoga'

const yoga = createYoga({
  plugins: [useExecutionCancellation()]
})
```

**Action Required** In order to benefit from this new feature, you need to update your integration setup for Fastify, Koa and Hapi.

```diff
- const response = await yoga.handleNodeRequest(req, { ... })
+ const response = await yoga.handleNodeRequestAndResponse(req, res, { ... })
```

Please refer to the corresponding integration guides for examples.
- [Fastify](https://graphql-yoga.com/docs/integrations/integration-with-fastify#example)
- [Koa](https://graphql-yoga.com/docs/integrations/integration-with-koa#example)
- [Hapi](https://graphql-yoga.com/docs/integrations/integration-with-hapi#example)
