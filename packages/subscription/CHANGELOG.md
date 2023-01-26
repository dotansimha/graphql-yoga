# @graphql-yoga/subscription

## 3.1.0

### Minor Changes

- [#2291](https://github.com/dotansimha/graphql-yoga/pull/2291) [`fe4a2aca`](https://github.com/dotansimha/graphql-yoga/commit/fe4a2aca4eece85d234be9ce3f82dcae274148a8) Thanks [@n1ru4l](https://github.com/n1ru4l)! - Support returning a `Promise` from the `filter` utility function.

  ```ts
  const applyFilter = filter((value) => Promise.resolve(value > 3))
  ```

## 3.0.0

### Major Changes

- [#1761](https://github.com/dotansimha/graphql-yoga/pull/1761) [`b2407c6a`](https://github.com/dotansimha/graphql-yoga/commit/b2407c6addab136e3390bd4efa1fbbad7eb8dab8) Thanks [@ardatan](https://github.com/ardatan)! - - Drop `TypedEvent` in favor of [`CustomEvent`](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent)
  - Use `@whatwg-node/events` as a ponyfill instead of `@whatwg-node/fetch`

### Patch Changes

- Updated dependencies [[`b2407c6a`](https://github.com/dotansimha/graphql-yoga/commit/b2407c6addab136e3390bd4efa1fbbad7eb8dab8)]:
  - @graphql-yoga/typed-event-target@1.0.0

## 3.0.0-next.0

### Major Changes

- [#1761](https://github.com/dotansimha/graphql-yoga/pull/1761) [`b2407c6a`](https://github.com/dotansimha/graphql-yoga/commit/b2407c6addab136e3390bd4efa1fbbad7eb8dab8) Thanks [@ardatan](https://github.com/ardatan)! - **BREAKING**:

  - Drop `TypedEvent` in favor of [`CustomEvent`](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent)
  - Use `@whatwg-node/events` as a ponyfill instead of `@whatwg-node/fetch`

### Patch Changes

- Updated dependencies [[`b2407c6a`](https://github.com/dotansimha/graphql-yoga/commit/b2407c6addab136e3390bd4efa1fbbad7eb8dab8)]:
  - @graphql-yoga/typed-event-target@1.0.0-next.0

## 2.2.3

### Patch Changes

- eecf24c: Fix CommonJS TypeScript resolution with `moduleResolution` `node16` or `nodenext`
- Updated dependencies [eecf24c]
  - @graphql-yoga/typed-event-target@0.1.1

## 2.2.2

### Patch Changes

- 3363de2: Use `import type { Foo } from '@pkg'` instead of `import { type Foo } from '@pkg'` as many tools don't yet support this syntax.

## 2.2.1

### Patch Changes

- ebddc71: Correctly handle empty ('undefined') payloads.

## 2.2.0

### Minor Changes

- d024757: Use `@graphql-yoga/typed-event-target` as a dependency for the EventTarget implementation.

### Patch Changes

- Updated dependencies [d024757]
  - @graphql-yoga/typed-event-target@0.1.0

## 2.1.0

### Minor Changes

- 7de07cd: Support TypeScript ECMA script resolution. More information on https://devblogs.microsoft.com/typescript/announcing-typescript-4-7/#ecmascript-module-support-in-node-js

## 2.0.0

### Major Changes

- 3e771f5: re-export `Repeater` from `@repeaterjs/repeater`
- e99ec3e: initial subscription package implementation
- f856b58: export PubSub type
- 3e771f5: add pipe helper function
- f856b58: allow any AsyncIterable source for the map and filter operator
- dcaea56: add missing tslib dependency

### Patch Changes

- 8d03bee: fix publishing values when using the id argument for granular resource based subscriptions
- de1693e: trigger release
- f856b58: correctly terminate AsyncIterable returned from map/filter when the source stream ends

## 0.0.1-beta.1

### Patch Changes

- 8d03bee: fix publishing values when using the id argument for granular resource based subscriptions

## 0.0.1-beta.0

### Patch Changes

- de1693e: trigger release

## 0.1.0-alpha.2

### Minor Changes

- dcaea56: add missing tslib dependency

## 0.1.0-alpha.1

### Minor Changes

- 3e771f5: re-export `Repeater` from `@repeaterjs/repeater`
- f856b58: export PubSub type
- 3e771f5: add pipe helper function
- f856b58: allow any AsyncIterable source for the map and filter operator

### Patch Changes

- f856b58: correctly terminate AsyncIterable returned from map/filter when the source stream ends

## 0.1.0-alpha.0

### Minor Changes

- e99ec3e: initial subscription package implementation
