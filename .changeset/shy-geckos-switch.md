---
'@graphql-yoga/common': patch
'@graphql-yoga/node': patch
---

Return correct 413 (Request Entity Too Large) HTTP status code if the given request body is larger then the specified one in `multipart` options.
Previously it was returning 400 or 500 which is an incorrect behavior misleading the client.
