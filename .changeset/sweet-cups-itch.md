---
'@graphql-yoga/common': patch
'@graphql-yoga/node': patch
---

fix(common): now checks if the request url matches with the given endpoint and gives 404 if not
fix(node): now defaults endpoint to /graphql and gives 404 if not
