---
'@graphql-yoga/typed-event-target': patch
---

Improve typings for `TypedEventTarget<TEvent>`, so `addEventListener` and `removeEventListener` methods now expect `type` to be the `type` property of `TEvent`, and `dispatchEvent` expects to get `TEvent`.


