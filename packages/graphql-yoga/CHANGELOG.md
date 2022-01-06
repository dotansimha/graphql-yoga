# graphql-yoga

## 2.0.0-alpha.7

### Patch Changes

- 3d54829: enhance: move W3C changes
- Updated dependencies [3d54829]
  - @graphql-yoga/core@0.2.0-alpha.6
  - @graphql-yoga/handler@0.2.0-alpha.3

## 2.0.0-alpha.6

### Minor Changes

- 36af58e: export renderGraphiQL function

### Patch Changes

- Updated dependencies [36af58e]
  - @graphql-yoga/core@0.2.0-alpha.5
  - @graphql-yoga/handler@0.2.0-alpha.2

## 2.0.0-alpha.5

### Patch Changes

- Updated dependencies [d2c2d18]
  - @graphql-yoga/core@0.2.0-alpha.4

## 2.0.0-alpha.4

### Minor Changes

- fb894da: Rename createGraphQLServer to createServer

### Patch Changes

- Updated dependencies [e99ec3e]
- Updated dependencies [fb894da]
  - @graphql-yoga/subscription@0.1.0-alpha.0
  - @graphql-yoga/core@0.2.0-alpha.3

## 2.0.0-alpha.3

### Minor Changes

- 0edf1f8: feat: options for GraphiQL
- 1a20e1e: Export everything from @envelop/core and export GraphQLFile scalar
- 9554f81: Add PubSub utility.
- 95e0ac0: feat: remove unnecessary Upload scalar types

### Patch Changes

- Updated dependencies [0edf1f8]
- Updated dependencies [95e0ac0]
  - @graphql-yoga/core@0.2.0-alpha.2
  - @graphql-yoga/handler@0.2.0-alpha.1

## 2.0.0-alpha.2

### Patch Changes

- Updated dependencies [5de1acf]
  - @graphql-yoga/core@0.2.0-alpha.1

## 2.0.0-alpha.1

### Minor Changes

- d078e84: Drop fastify and use node-http package

### Patch Changes

- Updated dependencies [d078e84]
- Updated dependencies [d8f8a81]
  - @graphql-yoga/core@0.2.0-alpha.0
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
