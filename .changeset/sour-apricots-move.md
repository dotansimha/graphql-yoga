---
'@graphql-yoga/redis-event-target': major
'@graphql-yoga/typed-event-target': major
'@graphql-yoga/subscription': major
---

- Drop `TypedEvent` in favor of [`CustomEvent`](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent)
- Use `@whatwg-node/events` as a ponyfill instead of `@whatwg-node/fetch`
