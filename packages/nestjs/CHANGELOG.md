# @graphql-yoga/nestjs

## 1.0.1

### Patch Changes

- Updated dependencies [[`ebb65b14`](https://github.com/dotansimha/graphql-yoga/commit/ebb65b14b29bbb4c50c6bb242262444315e99a73), [`528941cb`](https://github.com/dotansimha/graphql-yoga/commit/528941cb4d1670833ee0307de0c715e6b9681d7a)]:
  - graphql-yoga@3.8.1

## 1.0.0

### Major Changes

- [#2525](https://github.com/dotansimha/graphql-yoga/pull/2525) [`41f4a545`](https://github.com/dotansimha/graphql-yoga/commit/41f4a545637e3ab16cf8119c4950ea7fe5ab3eb6) Thanks [@enisdenjo](https://github.com/enisdenjo)! - GraphQL Yoga driver for NestJS GraphQL.

  ### BREAKING CHANGES

  - No more `subscriptionWithFilter` in YogaBaseDriver.
  - `YogaBaseDriver.yogaInstance` has been renamed to `YogaBaseDriver.yoga`
  - `YogaBaseDriver` has been renamed to `AbstractYogaDriver`
  - Drop `@envelop/apollo-server-errors`, if you want to use it - supply it to the plugins yourself
  - `graphql` is now a peer dependency
  - `graphql-yoga` is now a peer dependency
  - `installSubscriptionHandlers` driver option has been dropped, please use the `subscriptions`
    option
  - Apollo Federation v2 support
  - Apollo Federation driver has been moved to a separate package `@graphql-yoga/nestjs-federation`
  - Dropped support for `@nestjs/graphql@v10`, now at least v11 is required (https://github.com/nestjs/graphql/pull/2435)
  - Minimum Node.js engine is v14

### Patch Changes

- Updated dependencies [[`99b72696`](https://github.com/dotansimha/graphql-yoga/commit/99b726961b45b9c22d6383e2fe7212d21d324553), [`99b72696`](https://github.com/dotansimha/graphql-yoga/commit/99b726961b45b9c22d6383e2fe7212d21d324553), [`09d23a4b`](https://github.com/dotansimha/graphql-yoga/commit/09d23a4b3b22f520c41f3cebbe3b11ffbda39557)]:
  - graphql-yoga@3.8.0

## 0.3.1

### Patch Changes

- 05d838c: Make Fastify platform work (#79)

## 0.3.0

### Minor Changes

- 2c1f603: @nestjs/graphql should be a peer dependency

## 0.2.0

### Minor Changes

- 8161b3e: Support NestJS v9

## 0.1.0

### Minor Changes

- c58c7d5: Yoga v3

## 0.0.4

### Patch Changes

- b57dd7a: Fix Federated service code-first schema generation

## 0.0.3

### Patch Changes

- 486baac: fix build

## 0.0.2

### Patch Changes

- 3237986: update documentation
