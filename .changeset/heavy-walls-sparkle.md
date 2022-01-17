---
'@graphql-yoga/common': minor
---

**BREAKING** Move `typeDefs` and `resolvers` under the `schema` option.

```diff
const graphQLServer = createServer({
+ schema:
    typeDefs: /* GraphQL */ `
      type Query {
        hello: String
      }
      type Subscription {
        countdown(from: Int!): Int!
      }
    `,
    resolvers: {
      Query: {
        hello: () => 'world',
      },
    },
+ }
})
```

The `schema` option is now optional and Yoga will use a simple hello world schema if no other schema is provided.
