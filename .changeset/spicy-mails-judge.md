---
'graphql-yoga': patch
---

All unexpected errors even if they are masked/wrapped
The HTTP status code will be determined by the specific protocol the client is sending.

> "Unexpected error." means an Error that is not an instance of GraphQLError or an instance of GraphQLError with an `originalError` that is not an instance of GraphQLError recursively.
