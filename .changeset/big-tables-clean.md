---
'@graphql-yoga/plugin-response-cache': minor
---

Add `servedFromResponseCache` symbol property to responses served from the response cache in order
to allow other plugins to determine, whether a response was served from the cache and apply custom
logic based on that.
