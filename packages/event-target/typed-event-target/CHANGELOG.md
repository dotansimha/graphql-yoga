# @graphql-yoga/typed-event-target

## 2.0.0

### Major Changes

- [#2767](https://github.com/dotansimha/graphql-yoga/pull/2767) [`4228c1d5`](https://github.com/dotansimha/graphql-yoga/commit/4228c1d54ed785fac1fb9669d861ed46659872ca) Thanks [@renovate](https://github.com/apps/renovate)! - Drop support for Node.js 14. Require Node.js `>=16`.

- [#2767](https://github.com/dotansimha/graphql-yoga/pull/2767) [`4228c1d5`](https://github.com/dotansimha/graphql-yoga/commit/4228c1d54ed785fac1fb9669d861ed46659872ca) Thanks [@renovate](https://github.com/apps/renovate)! - Events without an event payload will now always have `null` as the event payload instead of `undefined`.

## 1.0.0

### Major Changes

- [#1761](https://github.com/dotansimha/graphql-yoga/pull/1761) [`b2407c6a`](https://github.com/dotansimha/graphql-yoga/commit/b2407c6addab136e3390bd4efa1fbbad7eb8dab8) Thanks [@ardatan](https://github.com/ardatan)! - - Drop `TypedEvent` in favor of [`CustomEvent`](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent)
  - Use `@whatwg-node/events` as a ponyfill instead of `@whatwg-node/fetch`

## 1.0.0-next.0

### Major Changes

- [#1761](https://github.com/dotansimha/graphql-yoga/pull/1761) [`b2407c6a`](https://github.com/dotansimha/graphql-yoga/commit/b2407c6addab136e3390bd4efa1fbbad7eb8dab8) Thanks [@ardatan](https://github.com/ardatan)! - **BREAKING**:

  - Drop `TypedEvent` in favor of [`CustomEvent`](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent)
  - Use `@whatwg-node/events` as a ponyfill instead of `@whatwg-node/fetch`

## 0.1.1

### Patch Changes

- eecf24c: Fix CommonJS TypeScript resolution with `moduleResolution` `node16` or `nodenext`

## 0.1.0

### Minor Changes

- d024757: Initial release of this package. It contains an EventTarget implementation with generic typings.
