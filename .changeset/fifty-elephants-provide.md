---
'graphql-yoga': patch
'@graphql-yoga/plugin-apollo-inline-trace': patch
'@graphql-yoga/plugin-apq': patch
---

`schema` no longer accepts an object of `typeDefs` and `resolvers` but instead you can use `createSchema` to create a GraphQL schema.
