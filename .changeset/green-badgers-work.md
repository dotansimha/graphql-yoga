---
'graphql-yoga': minor
---

Abort GraphQL execution when HTTP request is canceled.

The execution of subsequent GraphQL resolvers is now aborted if the incoming HTTP request is canceled from the client side.
This reduces the load of your API in case incoming requests with deep GraphQL operation selection sets are canceled.
