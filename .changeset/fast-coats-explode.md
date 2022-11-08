---
'graphql-yoga': patch
---

Handle edge case where `Content-Type` header provides a list like;

```
Content-Type: application/json, text/plain, */*
```
