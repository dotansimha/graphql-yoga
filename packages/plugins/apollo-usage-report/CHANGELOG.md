# @graphql-yoga/plugin-apollo-usage-report

## 0.5.2

### Patch Changes

- [#3549](https://github.com/dotansimha/graphql-yoga/pull/3549)
  [`05fe345`](https://github.com/dotansimha/graphql-yoga/commit/05fe34588fbeb28de847db9d7d58c5a6ae90e36b)
  Thanks [@ardatan](https://github.com/ardatan)! - dependencies updates:
  - Removed dependency
    [`@graphql-tools/utils@^10.6.1` ↗︎](https://www.npmjs.com/package/@graphql-tools/utils/v/10.6.1)
    (from `peerDependencies`)
  - Removed dependency
    [`@whatwg-node/fetch@^0.10.1` ↗︎](https://www.npmjs.com/package/@whatwg-node/fetch/v/0.10.1)
    (from `peerDependencies`)
- Updated dependencies
  [[`eca7cd1`](https://github.com/dotansimha/graphql-yoga/commit/eca7cd1163c58a5505ea371f745cb196f8bb20df),
  [`05fe345`](https://github.com/dotansimha/graphql-yoga/commit/05fe34588fbeb28de847db9d7d58c5a6ae90e36b)]:
  - graphql-yoga@5.10.5
  - @graphql-yoga/plugin-apollo-inline-trace@3.10.5

## 0.5.1

### Patch Changes

- [#3520](https://github.com/dotansimha/graphql-yoga/pull/3520)
  [`944ecd5`](https://github.com/dotansimha/graphql-yoga/commit/944ecd55abb1b77e88950eb3396919939915feb7)
  Thanks [@ardatan](https://github.com/ardatan)! - dependencies updates:
  - Updated dependency
    [`@graphql-tools/utils@^10.6.1` ↗︎](https://www.npmjs.com/package/@graphql-tools/utils/v/10.6.1)
    (from `^10.0.0`, in `peerDependencies`)
- Updated dependencies
  [[`944ecd5`](https://github.com/dotansimha/graphql-yoga/commit/944ecd55abb1b77e88950eb3396919939915feb7),
  [`944ecd5`](https://github.com/dotansimha/graphql-yoga/commit/944ecd55abb1b77e88950eb3396919939915feb7)]:
  - @graphql-yoga/plugin-apollo-inline-trace@3.10.4
  - graphql-yoga@5.10.4

## 0.5.0

### Minor Changes

- [#3458](https://github.com/dotansimha/graphql-yoga/pull/3458)
  [`cb29c6c`](https://github.com/dotansimha/graphql-yoga/commit/cb29c6c03c83b552a39c3d5a4d2c1de2a9df4bee)
  Thanks [@kroupacz](https://github.com/kroupacz)! - ### Removed
  - **Breaking change** remove option to set `clientName` and `clientVersion` as a static `string`
    in `ApolloUsageReportOptions`

### Patch Changes

- [#3488](https://github.com/dotansimha/graphql-yoga/pull/3488)
  [`a4bc07f`](https://github.com/dotansimha/graphql-yoga/commit/a4bc07ff0120e8f817dd0efec575c1f35021e264)
  Thanks [@kroupacz](https://github.com/kroupacz)! - fixed: move logic from `onEnveloped` hook to
  `onParse` hook (`onParseEnd`) which prevents the `operationName` could be missing.

## 0.4.3

### Patch Changes

- Updated dependencies
  [[`c93366d`](https://github.com/dotansimha/graphql-yoga/commit/c93366df8b4a2edd209d1eb94d989eaba3b7031b),
  [`c93366d`](https://github.com/dotansimha/graphql-yoga/commit/c93366df8b4a2edd209d1eb94d989eaba3b7031b)]:
  - graphql-yoga@5.10.3
  - @graphql-yoga/plugin-apollo-inline-trace@3.10.3

## 0.4.2

### Patch Changes

- Updated dependencies
  [[`7a413bc`](https://github.com/dotansimha/graphql-yoga/commit/7a413bc4fac839fbdc4fbb3cd5241c7828b2f6da),
  [`7a413bc`](https://github.com/dotansimha/graphql-yoga/commit/7a413bc4fac839fbdc4fbb3cd5241c7828b2f6da)]:
  - graphql-yoga@5.10.2
  - @graphql-yoga/plugin-apollo-inline-trace@3.10.2

## 0.4.1

### Patch Changes

- [#3479](https://github.com/dotansimha/graphql-yoga/pull/3479)
  [`20cd9b6`](https://github.com/dotansimha/graphql-yoga/commit/20cd9b6cd58b507580e3d39621eb3dbc2ca4e781)
  Thanks [@ardatan](https://github.com/ardatan)! - dependencies updates:
  - Updated dependency
    [`@whatwg-node/fetch@^0.10.1` ↗︎](https://www.npmjs.com/package/@whatwg-node/fetch/v/0.10.1)
    (from `^0.9.22`, in `peerDependencies`)
- Updated dependencies
  [[`20cd9b6`](https://github.com/dotansimha/graphql-yoga/commit/20cd9b6cd58b507580e3d39621eb3dbc2ca4e781),
  [`20cd9b6`](https://github.com/dotansimha/graphql-yoga/commit/20cd9b6cd58b507580e3d39621eb3dbc2ca4e781)]:
  - @graphql-yoga/plugin-apollo-inline-trace@3.10.1
  - graphql-yoga@5.10.1

## 0.4.0

### Patch Changes

- [#3455](https://github.com/dotansimha/graphql-yoga/pull/3455)
  [`6e2ab86`](https://github.com/dotansimha/graphql-yoga/commit/6e2ab86060b4e88f8ab80b8b8c7c844c866bb5a0)
  Thanks [@kroupacz](https://github.com/kroupacz)! - - fixed: get specific or the nearest possible
  trace node if something fails at `non-nullable` GraphQL query field

- Updated dependencies
  [[`6e2ab86`](https://github.com/dotansimha/graphql-yoga/commit/6e2ab86060b4e88f8ab80b8b8c7c844c866bb5a0),
  [`f81501c`](https://github.com/dotansimha/graphql-yoga/commit/f81501c70213330323a1d6ee9d45b3206af3675f)]:
  - @graphql-yoga/plugin-apollo-inline-trace@3.10.0
  - graphql-yoga@5.10.0

## 0.3.0

### Patch Changes

- [#3457](https://github.com/dotansimha/graphql-yoga/pull/3457)
  [`2523d9f`](https://github.com/dotansimha/graphql-yoga/commit/2523d9fa954b82e11412918aab2ae6fe7e7611d6)
  Thanks [@kroupacz](https://github.com/kroupacz)! - ### Fixed
  - do not set default values for `clientName` and `clientVersion`
- Updated dependencies
  [[`2523d9f`](https://github.com/dotansimha/graphql-yoga/commit/2523d9fa954b82e11412918aab2ae6fe7e7611d6),
  [`87ee333`](https://github.com/dotansimha/graphql-yoga/commit/87ee333724c0c6e0b9f72aa50e38a0a8a080593f)]:
  - graphql-yoga@5.9.0
  - @graphql-yoga/plugin-apollo-inline-trace@3.9.0

## 0.2.0

### Patch Changes

- [#3445](https://github.com/dotansimha/graphql-yoga/pull/3445)
  [`6bb19ed`](https://github.com/dotansimha/graphql-yoga/commit/6bb19edf5b103d6d9b6088e2e22cfa71a85f26f7)
  Thanks [@ardatan](https://github.com/ardatan)! - dependencies updates:

  - Updated dependency
    [`@whatwg-node/fetch@^0.9.22` ↗︎](https://www.npmjs.com/package/@whatwg-node/fetch/v/0.9.22)
    (from `^0.9.17`, in `peerDependencies`)

- [`18fe916`](https://github.com/dotansimha/graphql-yoga/commit/18fe916853fc6192b8b2a607f91b67f3a7cae7bc)
  Thanks [@kroupacz](https://github.com/kroupacz)! - - Send Apollo `clientName`, `clientVersion` and
  `agentVersion` (agent name) with trace.

- Updated dependencies
  [[`6bb19ed`](https://github.com/dotansimha/graphql-yoga/commit/6bb19edf5b103d6d9b6088e2e22cfa71a85f26f7),
  [`18fe916`](https://github.com/dotansimha/graphql-yoga/commit/18fe916853fc6192b8b2a607f91b67f3a7cae7bc),
  [`6bb19ed`](https://github.com/dotansimha/graphql-yoga/commit/6bb19edf5b103d6d9b6088e2e22cfa71a85f26f7)]:
  - @graphql-yoga/plugin-apollo-inline-trace@3.8.0
  - graphql-yoga@5.8.0

## 0.1.0

### Patch Changes

- Updated dependencies
  [[`5dae4ab`](https://github.com/dotansimha/graphql-yoga/commit/5dae4abeb6a4aa82f396a19d31d0155fe10bc752),
  [`5dae4ab`](https://github.com/dotansimha/graphql-yoga/commit/5dae4abeb6a4aa82f396a19d31d0155fe10bc752),
  [`5dae4ab`](https://github.com/dotansimha/graphql-yoga/commit/5dae4abeb6a4aa82f396a19d31d0155fe10bc752),
  [`5dae4ab`](https://github.com/dotansimha/graphql-yoga/commit/5dae4abeb6a4aa82f396a19d31d0155fe10bc752),
  [`5dae4ab`](https://github.com/dotansimha/graphql-yoga/commit/5dae4abeb6a4aa82f396a19d31d0155fe10bc752)]:
  - @graphql-yoga/plugin-apollo-inline-trace@3.7.0
  - graphql-yoga@5.7.0
