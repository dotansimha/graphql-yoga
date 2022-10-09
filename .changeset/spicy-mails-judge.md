---
'graphql-yoga': patch
---

- All unexpected errors even if they are masked/wrapped, HTTP status code will be set to 500.

> "Unexpected error" means an Error that is not an instance of GraphQLError or an instance of GraphQLError with an `originalError` that is not an instance of GraphQLError recursively.
