---
'@graphql-yoga/plugin-disable-introspection': minor
---

Expose the server context as the second parameter, so introspection can be disabled based on the
context

```ts "Disabling GraphQL schema introspection based on the context" {7}
import { createYoga } from 'graphql-yoga'
import { useDisableIntrospection } from '@graphql-yoga/plugin-disable-introspection'

// Provide your schema
const yoga = createYoga({
  graphiql: false,
  plugins: [
    useDisableIntrospection({
      isDisabled: (_req, ctx) => !ctx.jwt,
    })
  ]
})

const server = createServer(yoga)
server.listen(4000, () => {
  console.info('Server is running on http://localhost:4000/graphql')
})
```