# @graphql-yoga/redis-event-target

## 0.1.2

### Patch Changes

- 3363de2: Use `import type { Foo } from '@pkg'` instead of `import { type Foo } from '@pkg'` as many tools don't yet support this syntax.

## 0.1.1

### Patch Changes

- ebddc71: Correctly handle empty ('undefined') payloads.

## 0.1.0

### Minor Changes

- d024757: Initial release of this package. It contains an EventTarget implementation based upon Redis Pub/Sub using ioredis.

### Patch Changes

- Updated dependencies [d024757]
  - @graphql-yoga/typed-event-target@0.1.0
