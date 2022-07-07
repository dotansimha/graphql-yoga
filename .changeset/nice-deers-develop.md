---
'@graphql-yoga/common': minor
---

**Improve DX for Cloudflare Workers and other environments like Bun that needs a default export with a fetch method**

- You no longer need to export fetch specifically in a different object. Instead, you can export Yoga instance directly.

Before in CF Workers Modules you had to do;

```ts
import { createServer } from '@graphql-yoga/common'

const server = createServer()

export default {
  fetch: server.fetch,
}
```

Now you can export Yoga instance as-is like below;

```ts
import { createServer } from '@graphql-yoga/common'

export default createServer()
```

- Environment object is now passed as `ServerContext` to the execution. So you can access KV Namespaces and other `Env` variables in the context.

```ts
import { createServer } from '@graphql-yoga/common'

interface Env {
  MY_NAMESPACE: KVNamespace
  SOME_TOKEN: String // An example environment variable
}

export default createServer<Env>({
  typeDefs: /* GraphQL */ `
    type Query {
      todo(id: ID!): String
      todos: [String]
    }
    type Mutation {
      createTodo(id: ID!, text: String!): String
      deleteTodo(id: ID!): String
    }
  `,
  resolvers: {
    Query: {
      todo: (_, { id }, { MY_NAMESPACE }) => MY_NAMESPACE.get(id),
      todos: (_, __, { MY_NAMESPACE }) => MY_NAMESPACE.list(),
    },
    Mutation: {
      // MY_NAMESPACE is available as a GraphQL context
      createTodo(_, { id, text }, context) {
        return context.MY_NAMESPACE.put(id, text)
      },
      deleteTodo(_, { id }, context) {
        return context.MY_NAMESPACE.delete(id)
      },
    },
  },
})
```
