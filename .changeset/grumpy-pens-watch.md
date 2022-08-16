---
'@graphql-yoga/common': patch
'@graphql-yoga/node': patch
---

Apply the HTTP validation error plugin last in order to not interfere error masking when using the `handleValidationErrors` option.
