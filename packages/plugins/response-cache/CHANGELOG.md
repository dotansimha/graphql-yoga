# @graphql-yoga/plugin-response-cache

## 1.0.0-next.4

### Patch Changes

- Updated dependencies [[`02d2aecd`](https://github.com/dotansimha/graphql-yoga/commit/02d2aecdee55e4c54454c48c2ca0fd7425796ae0), [`b079c93b`](https://github.com/dotansimha/graphql-yoga/commit/b079c93ba47dc94d58f7d2b738a9423c29a149a1)]:
  - graphql-yoga@3.0.0-next.4

## 1.0.0-next.3

### Patch Changes

- Updated dependencies [[`64e06d74`](https://github.com/dotansimha/graphql-yoga/commit/64e06d74132a118f30b42b51c0e71abced0506a4)]:
  - graphql-yoga@3.0.0-next.3

## 1.0.0-next.2

### Patch Changes

- Updated dependencies [[`8c674c36`](https://github.com/dotansimha/graphql-yoga/commit/8c674c365e0bac176ca296e8d531fcd28d228d5b)]:
  - graphql-yoga@3.0.0-next.2

## 1.0.0-next.1

### Patch Changes

- Updated dependencies [[`44878a5b`](https://github.com/dotansimha/graphql-yoga/commit/44878a5b1be937ab0ffefccc327400c80bd62847)]:
  - graphql-yoga@3.0.0-next.1

## 1.0.0-next.0

### Major Changes

- [#1359](https://github.com/dotansimha/graphql-yoga/pull/1359) [`5629a5cb`](https://github.com/dotansimha/graphql-yoga/commit/5629a5cb675291a0a152ca203611d88d1f45b1bf) Thanks [@ardatan](https://github.com/ardatan)! - _New Response Cache Plugin!!!_

  On top of [`@envelop/response-cache`](https://www.envelop.dev/plugins/use-response-cache), this new plugin allows you to skip execution phase even before all the GraphQL execution phases immediately after the GraphQL request parameters is parsed by Yoga.

  Also it doesn't need to have `documentString` stored in somewhere in order to get it back during the execution to generate the cache key.

  All the features of the same except for the following:

  - `session` factory function takes `GraphQLParams` and `Request` objects instead of GraphQL context as arguments.

    - `type SessionIdFactory = (params: GraphQLParams, request: Request) => Maybe<string>`

  - `enabled` function takes `GraphQLParams` and `Request` objects instead of GraphQL context as arguments.
    - `type EnabledFn = (params: GraphQLParams, request: Request) => boolean`

### Patch Changes

- Updated dependencies [[`2e0c4824`](https://github.com/dotansimha/graphql-yoga/commit/2e0c482418af2281c9cf0c34dd16f207d850cdb7), [`f46addd7`](https://github.com/dotansimha/graphql-yoga/commit/f46addd767f38bc3a48d796b0f2cb02c5f5668ef), [`f4b23387`](https://github.com/dotansimha/graphql-yoga/commit/f4b233876c2db52886eb5211b029377450fdb7f1), [`eeaced00`](https://github.com/dotansimha/graphql-yoga/commit/eeaced008fdd1b209d6db81f3351803f2a0a1089), [`74e1f830`](https://github.com/dotansimha/graphql-yoga/commit/74e1f830b09bc21a970f7468af1363a22b8b592b), [`e7a47b56`](https://github.com/dotansimha/graphql-yoga/commit/e7a47b56fbdf3abbb8f0d590ade867805a84157e), [`1d7f810a`](https://github.com/dotansimha/graphql-yoga/commit/1d7f810a8ee3fc00f6dbde461010683eb354da2d), [`209b1620`](https://github.com/dotansimha/graphql-yoga/commit/209b1620055cf64647943b1c334852a314aff3a4), [`098e139f`](https://github.com/dotansimha/graphql-yoga/commit/098e139f2b08196bfee04a71bcd024501dceacd8), [`74e1f830`](https://github.com/dotansimha/graphql-yoga/commit/74e1f830b09bc21a970f7468af1363a22b8b592b), [`c4b3a9c8`](https://github.com/dotansimha/graphql-yoga/commit/c4b3a9c8031f7b61420bb9cdc4bc6e7fc22615a5), [`1d5cde96`](https://github.com/dotansimha/graphql-yoga/commit/1d5cde96ce5b7647de7d329f9f56e398463a9152)]:
  - graphql-yoga@3.0.0-next.0
