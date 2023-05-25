---
'@graphql-yoga/redis-event-target': major
'@graphql-yoga/typed-event-target': major
'graphql-yoga': major
'@graphql-yoga/subscription': major
---

Events without an event payload will now always have `null` as the event payload instead of `undefined`.
