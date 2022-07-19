---
'@graphql-yoga/common': patch
---

Now GraphQL Yoga throws a better descriptive error message if the client sends a request with a non-string query parameter instead of expecting graphql.parse to fail and throw a cryptic JS TypeError.
