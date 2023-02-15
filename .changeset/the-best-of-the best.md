---
'graphql-yoga': patch
---

Replace LRU caching with lazy URL construction, avoid unnecessary `parse` and `validate` invocation and CORS
