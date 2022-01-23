# @graphql-yoga/common

## 0.2.0-alpha.8

### Patch Changes

- f2f6202: fix(common): respect given graphiql options

## 0.2.0-alpha.7

### Minor Changes

- 6750eff: rename `GraphQLServerError` to `GraphQLYogaError`.
- d414f95: **BREAKING** Set `maskedErrors` value to `true` by default for safer defaults.

  **BREAKING** Remove `disableIntrospection`. [Please use `useDisableIntrospection` from `@envelop/disable-introspection` instead.](https://www.envelop.dev/plugins/use-disable-introspection)

- bea2dcc: align envelop types
- fc1f2c7: make options optional
- 603ccd8: feat(handler): refactor processRequest by removing the overhead in context build phase
- e93e62d: **BREAKING** Move `typeDefs` and `resolvers` under the `schema` option.

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

### Patch Changes

- b1facf8: fix(common): bump cross-undici-fetch to fix missing mimetype issue in uploaded files
- b37564e: Enable introspection options
- 5d840d9: better naming: replace introspection option name with disableIntrospection
- a10a16c: Node Server implementation has been moved to `@graphql-yoga/node` package.

  CLI implementation has been moved to
  `graphql-yoga` package.

- Updated dependencies [3e771f5]
- Updated dependencies [f856b58]
- Updated dependencies [3e771f5]
- Updated dependencies [f856b58]
- Updated dependencies [f856b58]
  - @graphql-yoga/subscription@0.1.0-alpha.1

## 0.2.0-alpha.6

### Patch Changes

- 3d54829: enhance: move W3C changes
- Updated dependencies [3d54829]
  - @graphql-yoga/handler@0.2.0-alpha.3

## 0.2.0-alpha.5

### Minor Changes

- 36af58e: export renderGraphiQL function

### Patch Changes

- Updated dependencies [36af58e]
  - @graphql-yoga/handler@0.2.0-alpha.2

## 0.2.0-alpha.4

### Minor Changes

- d2c2d18: expose options for enabling introspection and maskedErrors

## 0.2.0-alpha.3

### Minor Changes

- fb894da: Rename createGraphQLServer to createServer

## 0.2.0-alpha.2

### Minor Changes

- 0edf1f8: feat: options for GraphiQL
- 95e0ac0: feat: remove unnecessary Upload scalar types

### Patch Changes

- Updated dependencies [0edf1f8]
- Updated dependencies [95e0ac0]
  - @graphql-yoga/handler@0.2.0-alpha.1

## 0.2.0-alpha.1

### Minor Changes

- 5de1acf: feat(core): add File and Blob scalars automatically

## 0.2.0-alpha.0

### Minor Changes

- d078e84: Drop fastify and use node-http package
- d8f8a81: feat(core): take typeDefs, resolvers and context as param

### Patch Changes

- Updated dependencies [d078e84]
  - @graphql-yoga/handler@0.2.0-alpha.0
