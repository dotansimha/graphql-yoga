---
'@graphql-yoga/plugin-prometheus': patch
---

`request` is missing when GraphQL WS is used as expected, and as we don't need HTTP/Yoga specific
metrics, this should be skipped
