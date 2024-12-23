---
'@graphql-yoga/plugin-sofa': patch
---

Fix the issue when SOFA returns 404 response from error extensions returned by a resolver, it will cause the server to continue the request handling with Yoga but instead it should return the response with 404 and the body SOFA returns.