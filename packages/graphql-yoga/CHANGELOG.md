# graphql-yoga

## 2.0.0-beta.7

### Patch Changes

- Updated dependencies [14c93a7]
- Updated dependencies [ec777b1]
- Updated dependencies [8ab60cf]
  - @graphql-yoga/node@0.1.0-beta.7

## 2.0.0-beta.6

### Patch Changes

- @graphql-yoga/node@0.1.0-beta.6

## 2.0.0-beta.5

### Patch Changes

- Updated dependencies [cfec14b]
- Updated dependencies [5fba736]
- Updated dependencies [44ad1b3]
  - @graphql-yoga/node@0.1.0-beta.5

## 2.0.0-beta.4

### Patch Changes

- Updated dependencies [433558f]
- Updated dependencies [433558f]
  - @graphql-yoga/node@0.1.0-beta.4

## 2.0.0-beta.3

### Patch Changes

- Updated dependencies [62e8c07]
  - @graphql-yoga/node@0.1.0-beta.3

## 2.0.0-beta.2

### Patch Changes

- Updated dependencies [daeea82]
  - @graphql-yoga/node@0.0.1-beta.2

## 2.0.0-beta.1

### Patch Changes

- @graphql-yoga/node@0.0.1-beta.1

## 2.0.0-beta.0

### Major Changes

- de1693e: trigger release

### Patch Changes

- Updated dependencies [de1693e]
  - @graphql-yoga/node@0.0.1-beta.0

## 2.0.0-alpha.12

### Minor Changes

- dcaea56: add missing tslib dependency

### Patch Changes

- Updated dependencies [133f8e9]
- Updated dependencies [dcaea56]
- Updated dependencies [f5f06f4]
- Updated dependencies [dcaea56]
- Updated dependencies [ce60a48]
- Updated dependencies [dcaea56]
  - @graphql-yoga/node@0.1.0-alpha.4

## 2.0.0-alpha.11

### Patch Changes

- @graphql-yoga/node@0.1.0-alpha.3

## 2.0.0-alpha.10

### Patch Changes

- Updated dependencies [b0b244b]
  - @graphql-yoga/node@0.1.0-alpha.2

## 2.0.0-alpha.9

### Patch Changes

- @graphql-yoga/node@0.1.0-alpha.1

## 2.0.0-alpha.8

### Minor Changes

- 6750eff: rename `GraphQLServerError` to `GraphQLYogaError`.
- d414f95: **BREAKING** Set `maskedErrors` value to `true` by default for safer defaults.

  **BREAKING** Remove `disableIntrospection`. [Please use `useDisableIntrospection` from `@envelop/disable-introspection` instead.](https://www.envelop.dev/plugins/use-disable-introspection)

- bea2dcc: align envelop types
- fc1f2c7: make options optional

### Patch Changes

- 6effd5d: fix(node): handle response cancellation correctly
- a10a16c: Node Server implementation has been moved to `@graphql-yoga/node` package.

  CLI implementation has been moved to
  `graphql-yoga` package.

- Updated dependencies [d414f95]
- Updated dependencies [a10a16c]
  - @graphql-yoga/node@0.1.0-alpha.0

## 2.0.0-alpha.7

### Patch Changes

- 3d54829: enhance: move W3C changes
- Updated dependencies [3d54829]
  - @graphql-yoga/common@0.2.0-alpha.6
  - @graphql-yoga/handler@0.2.0-alpha.3

## 2.0.0-alpha.6

### Minor Changes

- 36af58e: export renderGraphiQL function

### Patch Changes

- Updated dependencies [36af58e]
  - @graphql-yoga/common@0.2.0-alpha.5
  - @graphql-yoga/handler@0.2.0-alpha.2

## 2.0.0-alpha.5

### Patch Changes

- Updated dependencies [d2c2d18]
  - @graphql-yoga/common@0.2.0-alpha.4

## 2.0.0-alpha.4

### Minor Changes

- fb894da: Rename createGraphQLServer to createServer

### Patch Changes

- Updated dependencies [e99ec3e]
- Updated dependencies [fb894da]
  - @graphql-yoga/subscription@0.1.0-alpha.0
  - @graphql-yoga/common@0.2.0-alpha.3

## 2.0.0-alpha.3

### Minor Changes

- 0edf1f8: feat: options for GraphiQL
- 1a20e1e: Export everything from @envelop/core and export GraphQLFile scalar
- 9554f81: Add PubSub utility.
- 95e0ac0: feat: remove unnecessary Upload scalar types

### Patch Changes

- Updated dependencies [0edf1f8]
- Updated dependencies [95e0ac0]
  - @graphql-yoga/common@0.2.0-alpha.2
  - @graphql-yoga/handler@0.2.0-alpha.1

## 2.0.0-alpha.2

### Patch Changes

- Updated dependencies [5de1acf]
  - @graphql-yoga/common@0.2.0-alpha.1

## 2.0.0-alpha.1

### Minor Changes

- d078e84: Drop fastify and use node-http package

### Patch Changes

- Updated dependencies [d078e84]
- Updated dependencies [d8f8a81]
  - @graphql-yoga/common@0.2.0-alpha.0
  - @graphql-yoga/handler@0.2.0-alpha.0

## 2.0.0-alpha.0

### Major Changes

- b6dd3f1: The goal is to provide a fully-featured, simple to set up, performant and extendable server. Some key features:

  - [GraphQL-over-HTTP](https://github.com/graphql/graphql-over-http) spec compliant
  - Extend the GraphQL request flow using [`envelop`](https://www.envelop.dev/)
  - File uploads (via GraphQL multipart request specification)
  - GraphQL Subscriptions (using [SSE](https://github.com/enisdenjo/graphql-sse))
  - Logging using [Pino](https://github.com/pinojs/pino)
  - Improved TypeScript Support
  - Try out experimental GraphQL features such as `@defer` and `@stream`
