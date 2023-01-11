# @graphql-yoga/redis-event-target

## 1.0.0

### Major Changes

- [#1761](https://github.com/dotansimha/graphql-yoga/pull/1761)
  [`b2407c6a`](https://github.com/dotansimha/graphql-yoga/commit/b2407c6addab136e3390bd4efa1fbbad7eb8dab8)
  Thanks [@ardatan](https://github.com/ardatan)! - - Drop `TypedEvent` in favor of
  [`CustomEvent`](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent)
  - Use `@whatwg-node/events` as a ponyfill instead of `@whatwg-node/fetch`

### Patch Changes

- Updated dependencies
  [[`b2407c6a`](https://github.com/dotansimha/graphql-yoga/commit/b2407c6addab136e3390bd4efa1fbbad7eb8dab8)]:
  - @graphql-yoga/typed-event-target@1.0.0

## 1.0.0-next.0

### Major Changes

- [#1761](https://github.com/dotansimha/graphql-yoga/pull/1761)
  [`b2407c6a`](https://github.com/dotansimha/graphql-yoga/commit/b2407c6addab136e3390bd4efa1fbbad7eb8dab8)
  Thanks [@ardatan](https://github.com/ardatan)! - **BREAKING**:

  - Drop `TypedEvent` in favor of
    [`CustomEvent`](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent)
  - Use `@whatwg-node/events` as a ponyfill instead of `@whatwg-node/fetch`

### Patch Changes

- Updated dependencies
  [[`b2407c6a`](https://github.com/dotansimha/graphql-yoga/commit/b2407c6addab136e3390bd4efa1fbbad7eb8dab8)]:
  - @graphql-yoga/typed-event-target@1.0.0-next.0

## 0.1.3

### Patch Changes

- eecf24c: Fix CommonJS TypeScript resolution with `moduleResolution` `node16` or `nodenext`
- Updated dependencies [eecf24c]
  - @graphql-yoga/typed-event-target@0.1.1

## 0.1.2

### Patch Changes

- 3363de2: Use `import type { Foo } from '@pkg'` instead of `import { type Foo } from '@pkg'` as
  many tools don't yet support this syntax.

## 0.1.1

### Patch Changes

- ebddc71: Correctly handle empty ('undefined') payloads.

## 0.1.0

### Minor Changes

- d024757: Initial release of this package. It contains an EventTarget implementation based upon
  Redis Pub/Sub using ioredis.

### Patch Changes

- Updated dependencies [d024757]
  - @graphql-yoga/typed-event-target@0.1.0
