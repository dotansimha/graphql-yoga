---
'@graphql-yoga/common': minor
---

Support `application/graphql`, `application/x-www-form-urlencoded` and `application/graphql+json` as defined in GraphQL over HTTP specification and implemented in `express-graphql` reference implementation so Yoga now accepts the following request bodies with specific "Content-Type" headers;

- `application/graphql` can accept `query something { somefield }` which takes the GraphQL operation directly as `POST` request body
- `application/x-www-form-urlencoded` can accept `query=something&variables={"somefield": "somevalue"}` which takes the GraphQL operation and variables as `POST` request body
