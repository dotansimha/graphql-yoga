# graphql-yoga

## 3.0.0-next.1

### Patch Changes

- [#1775](https://github.com/dotansimha/graphql-yoga/pull/1775) [`44878a5b`](https://github.com/dotansimha/graphql-yoga/commit/44878a5b1be937ab0ffefccc327400c80bd62847) Thanks [@enisdenjo](https://github.com/enisdenjo)! - Context typings improvements

## 3.0.0-next.0

### Major Changes

- [#1660](https://github.com/dotansimha/graphql-yoga/pull/1660) [`2e0c4824`](https://github.com/dotansimha/graphql-yoga/commit/2e0c482418af2281c9cf0c34dd16f207d850cdb7) Thanks [@saihaj](https://github.com/saihaj)! - _Drop Node 12 Support_

  GraphQL Yoga no longer supports Node 12 which is no longer an LTS version. GraphQL Yoga now needs Node 14 at least.

- [#1660](https://github.com/dotansimha/graphql-yoga/pull/1660) [`f46addd7`](https://github.com/dotansimha/graphql-yoga/commit/f46addd767f38bc3a48d796b0f2cb02c5f5668ef) Thanks [@saihaj](https://github.com/saihaj)! - See the migration guide for more information;

  [Migration from Yoga V2](https://www.graphql-yoga.com/v3/migration/migration-from-yoga-v2)

- [#1753](https://github.com/dotansimha/graphql-yoga/pull/1753) [`eeaced00`](https://github.com/dotansimha/graphql-yoga/commit/eeaced008fdd1b209d6db81f3351803f2a0a1089) Thanks [@ardatan](https://github.com/ardatan)! - `schema` no longer accepts an object of `typeDefs` and `resolvers` but instead you can use `createSchema` to create a GraphQL schema.

- [#1516](https://github.com/dotansimha/graphql-yoga/pull/1516) [`209b1620`](https://github.com/dotansimha/graphql-yoga/commit/209b1620055cf64647943b1c334852a314aff3a4) Thanks [@ardatan](https://github.com/ardatan)! - Now it is possible to decide the returned `Content-Type` by specifying the `Accept` header. So if `Accept` header has `text/event-stream` without `application/json`, Yoga respects that returns `text/event-stream` instead of `application/json`.

- [#1473](https://github.com/dotansimha/graphql-yoga/pull/1473) [`c4b3a9c8`](https://github.com/dotansimha/graphql-yoga/commit/c4b3a9c8031f7b61420bb9cdc4bc6e7fc22615a5) Thanks [@ardatan](https://github.com/ardatan)! - **BREAKING**: Remove `GraphQLYogaError` in favor of `GraphQLError`
  [Check the documentation to see how to use `GraphQLError`](https://www.graphql-yoga.com/v3/guides/error-masking)

### Minor Changes

- [#1610](https://github.com/dotansimha/graphql-yoga/pull/1610) [`f4b23387`](https://github.com/dotansimha/graphql-yoga/commit/f4b233876c2db52886eb5211b029377450fdb7f1) Thanks [@ardatan](https://github.com/ardatan)! - Pass the parsed request as-is and validate the final GraphQLParams in useCheckGraphQLParams

- [#1497](https://github.com/dotansimha/graphql-yoga/pull/1497) [`1d7f810a`](https://github.com/dotansimha/graphql-yoga/commit/1d7f810a8ee3fc00f6dbde461010683eb354da2d) Thanks [@ardatan](https://github.com/ardatan)! - Support a schema factory function that runs per request or a promise to be resolved before the first request.

  ```ts
  createYoga({
    schema(request: Request) {
      return getSchemaForToken(request.headers.get('x-my-token'))
    },
  })
  ```

  ```ts
  async function buildSchemaAsync() {
    const typeDefs = await fs.promises.readFile('./schema.graphql', 'utf8')
    const resolvers = await import('./resolvers.js')
    return makeExecutableSchema({ typeDefs, resolvers })
  }

  createYoga({
    schema: buildSchemaAsync(),
  })
  ```

- [#1662](https://github.com/dotansimha/graphql-yoga/pull/1662) [`098e139f`](https://github.com/dotansimha/graphql-yoga/commit/098e139f2b08196bfee04a71bcd024501dceacd8) Thanks [@ardatan](https://github.com/ardatan)! - - Batching RFC support with `batchingLimit` option to enable batching with an exact limit of requests per batch.
  - New `onParams` hook that takes a single `GraphQLParams` object
  - Changes in `onRequestParse` and `onRequestParseDone` hook
  - - Now `onRequestParseDone` receives the exact object that is passed by the request parser so it can be `GraphQLParams` or an array of `GraphQLParams` so use `onParams` if you need to manipulate batched execution params individually.

### Patch Changes

- [#1609](https://github.com/dotansimha/graphql-yoga/pull/1609) [`74e1f830`](https://github.com/dotansimha/graphql-yoga/commit/74e1f830b09bc21a970f7468af1363a22b8b592b) Thanks [@enisdenjo](https://github.com/enisdenjo)! - `usePreventMutationViaGET` doesn't do assertion if it is not `YogaContext`, so it is possible to use Yoga's Envelop instance with other server implementations like `graphql-ws`.

- [#1567](https://github.com/dotansimha/graphql-yoga/pull/1567) [`e7a47b56`](https://github.com/dotansimha/graphql-yoga/commit/e7a47b56fbdf3abbb8f0d590ade867805a84157e) Thanks [@n1ru4l](https://github.com/n1ru4l)! - Handle invalid POST body gracefully; - Reject `null` - Reject non-object body - Reject invalid JSON body

- [#1609](https://github.com/dotansimha/graphql-yoga/pull/1609) [`74e1f830`](https://github.com/dotansimha/graphql-yoga/commit/74e1f830b09bc21a970f7468af1363a22b8b592b) Thanks [@enisdenjo](https://github.com/enisdenjo)! - Expose readonly `graphqlEndpoint` in `YogaServerInstance`

  ```ts
  const yoga = createYoga({
    /*...*/
  })
  console.log(yoga.graphqlEndpoint) // /graphql by default
  ```

- [#1616](https://github.com/dotansimha/graphql-yoga/pull/1616) [`1d5cde96`](https://github.com/dotansimha/graphql-yoga/commit/1d5cde96ce5b7647de7d329f9f56e398463a9152) Thanks [@ardatan](https://github.com/ardatan)! - Support `application/graphql-response+json` as `Accept`ed content type for the response

- Updated dependencies [[`b2407c6a`](https://github.com/dotansimha/graphql-yoga/commit/b2407c6addab136e3390bd4efa1fbbad7eb8dab8)]:
  - @graphql-yoga/subscription@3.0.0-next.0

## 2.13.11

### Patch Changes

- Updated dependencies []:
  - @graphql-yoga/node@2.13.11

## 2.13.10

### Patch Changes

- Updated dependencies [[`779b55ee`](https://github.com/dotansimha/graphql-yoga/commit/779b55eea843bd282f659e1012f255f62fd888b6)]:
  - @graphql-yoga/node@2.13.10

## 2.13.9

### Patch Changes

- Updated dependencies []:
  - @graphql-yoga/node@2.13.9

## 2.13.8

### Patch Changes

- Updated dependencies []:
  - @graphql-yoga/node@2.13.8

## 2.13.7

### Patch Changes

- Updated dependencies [[`e4e8ade`](https://github.com/dotansimha/graphql-yoga/commit/e4e8ade526c2aec7ea28218ca7795e96b867fc6b), [`94b41f3`](https://github.com/dotansimha/graphql-yoga/commit/94b41f30f598afb37db2438c736764e2a539cd10)]:
  - @graphql-yoga/node@2.13.7

## 2.13.6

### Patch Changes

- eecf24c: Fix CommonJS TypeScript resolution with `moduleResolution` `node16` or `nodenext`
- Updated dependencies [eecf24c]
  - @graphql-yoga/node@2.13.6

## 2.13.5

### Patch Changes

- Updated dependencies [c00dad3]
  - @graphql-yoga/node@2.13.5

## 2.13.4

### Patch Changes

- @graphql-yoga/node@2.13.4

## 2.13.3

### Patch Changes

- Updated dependencies [639607d]
  - @graphql-yoga/node@2.13.3

## 2.13.2

### Patch Changes

- @graphql-yoga/node@2.13.2

## 2.13.1

### Patch Changes

- @graphql-yoga/node@2.13.1

## 2.13.0

### Patch Changes

- @graphql-yoga/node@2.13.0

## 2.12.0

### Patch Changes

- @graphql-yoga/node@2.12.0

## 2.11.2

### Patch Changes

- Updated dependencies [ca5f940]
  - @graphql-yoga/node@2.11.2

## 2.11.1

### Patch Changes

- Updated dependencies [9248df8]
  - @graphql-yoga/node@2.11.1

## 2.11.0

### Patch Changes

- Updated dependencies [8947657]
  - @graphql-yoga/node@2.11.0

## 2.10.0

### Minor Changes

- 7de07cd: Support TypeScript ECMA script resolution. More information on https://devblogs.microsoft.com/typescript/announcing-typescript-4-7/#ecmascript-module-support-in-node-js

### Patch Changes

- Updated dependencies [7de07cd]
- Updated dependencies [8922c3b]
  - @graphql-yoga/node@2.10.0

## 2.9.2

### Patch Changes

- @graphql-yoga/node@2.9.2

## 2.9.1

### Patch Changes

- @graphql-yoga/node@2.9.1

## 2.9.0

### Patch Changes

- Updated dependencies [06652c7]
- Updated dependencies [2d3c54c]
  - @graphql-yoga/node@2.9.0

## 2.8.0

### Patch Changes

- @graphql-yoga/node@2.8.0

## 2.7.0

### Patch Changes

- @graphql-yoga/node@2.7.0

## 2.6.1

### Patch Changes

- Updated dependencies [0224bf9]
  - @graphql-yoga/node@2.6.1

## 2.6.0

### Patch Changes

- @graphql-yoga/node@2.6.0

## 2.5.0

### Patch Changes

- Updated dependencies [8b6d896]
  - @graphql-yoga/node@2.5.0

## 2.4.1

### Patch Changes

- @graphql-yoga/node@2.4.1

## 2.4.0

### Patch Changes

- Updated dependencies [28e24c3]
- Updated dependencies [13f96db]
  - @graphql-yoga/node@2.4.0

## 2.3.0

### Patch Changes

- @graphql-yoga/node@2.3.0

## 2.2.1

### Patch Changes

- Updated dependencies [32e2e40]
  - @graphql-yoga/node@2.2.1

## 2.2.0

### Patch Changes

- Updated dependencies [1d4fe42]
  - @graphql-yoga/node@2.2.0

## 2.1.0

### Patch Changes

- Updated dependencies [4077773]
- Updated dependencies [2739db2]
- Updated dependencies [cd9394e]
  - @graphql-yoga/node@2.1.0

## 2.0.0

### Major Changes

- b6dd3f1: The goal is to provide a fully-featured, simple to set up, performant and extendable server. Some key features:

  - [GraphQL-over-HTTP](https://github.com/graphql/graphql-over-http) spec compliant
  - Extend the GraphQL request flow using [`envelop`](https://www.envelop.dev/)
  - File uploads (via GraphQL multipart request specification)
  - GraphQL Subscriptions (using [SSE](https://github.com/enisdenjo/graphql-sse))
  - Logging using [Pino](https://github.com/pinojs/pino)
  - Improved TypeScript Support
  - Try out experimental GraphQL features such as `@defer` and `@stream`

- de1693e: trigger release

### Minor Changes

- 6750eff: rename `GraphQLServerError` to `GraphQLYogaError`.
- 0edf1f8: feat: options for GraphiQL
- d414f95: **BREAKING** Set `maskedErrors` value to `true` by default for safer defaults.

  **BREAKING** Remove `disableIntrospection`. [Please use `useDisableIntrospection` from `@envelop/disable-introspection` instead.](https://www.envelop.dev/plugins/use-disable-introspection)

- 36af58e: export renderGraphiQL function
- bea2dcc: align envelop types
- fc1f2c7: make options optional
- fb894da: Rename createGraphQLServer to createServer
- 1a20e1e: Export everything from @envelop/core and export GraphQLFile scalar
- d078e84: Drop fastify and use node-http package
- 6d60ebf: add tabs to GraphiQL
- 9554f81: Add PubSub utility.
- 95e0ac0: feat: remove unnecessary Upload scalar types
- dcaea56: add missing tslib dependency

### Patch Changes

- 6effd5d: fix(node): handle response cancellation correctly
- 3d54829: enhance: move W3C changes
- 0edf1f8: feat(cli): binds GraphQL Config to GraphQL Yoga
- a10a16c: Node Server implementation has been moved to `@graphql-yoga/node` package.

  CLI implementation has been moved to
  `graphql-yoga` package.

- 5b6f025: feat(yoga-cli): fallback to default schema and add mock parameter
- Updated dependencies [d414f95]
- Updated dependencies [133f8e9]
- Updated dependencies [14c93a7]
- Updated dependencies [ec777b1]
- Updated dependencies [dcaea56]
- Updated dependencies [b0b244b]
- Updated dependencies [cfec14b]
- Updated dependencies [433558f]
- Updated dependencies [3c82b57]
- Updated dependencies [f5f06f4]
- Updated dependencies [dcaea56]
- Updated dependencies [8ab60cf]
- Updated dependencies [433558f]
- Updated dependencies [5fba736]
- Updated dependencies [62e8c07]
- Updated dependencies [ce60a48]
- Updated dependencies [a8b619b]
- Updated dependencies [6d60ebf]
- Updated dependencies [44ad1b3]
- Updated dependencies [0424fe3]
- Updated dependencies [de1693e]
- Updated dependencies [d60f79f]
- Updated dependencies [dcaea56]
- Updated dependencies [daeea82]
- Updated dependencies [a10a16c]
  - @graphql-yoga/node@0.1.0

## 2.0.0-beta.8

### Minor Changes

- 6d60ebf: add tabs to GraphiQL

### Patch Changes

- 5b6f025: feat(yoga-cli): fallback to default schema and add mock parameter
- Updated dependencies [3c82b57]
- Updated dependencies [6d60ebf]
- Updated dependencies [0424fe3]
- Updated dependencies [d60f79f]
  - @graphql-yoga/node@0.1.0-beta.8

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
