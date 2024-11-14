---
'graphql-yoga': patch
---

Fix issue where context values being shared between batched requests.

A bug within `@whatwg-node/server` caused properties assigned to a batched requests context to be
propagated to all other batched requests contexts. It is resolved by updating the dependency of
`@whatwg-node/server` to `0.9.55`.
