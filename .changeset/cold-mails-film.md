---
'graphql-yoga': minor
---

Expose server context in `onResultProcessHook`. In particular, this gives access to the `waitUntil`
method to cleanly handle hanging promises.
