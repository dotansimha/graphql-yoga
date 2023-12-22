---
'@graphql-yoga/plugin-jwt': patch
---

Fix unauthorized error resulting in an response with 500 status or in a server crash (depending on
actual HTTP server implementation used).
