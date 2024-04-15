---
'graphql-yoga': patch
---

In such environments like CloudFlare Workers, the `request` object in the context always has the initial request object, so it was impossible to access the actual `Request` object from the execution context.
Now Yoga ensures that the `request` in the context is the same with the actual `Request`.