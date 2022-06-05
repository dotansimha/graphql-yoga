---
'@graphql-yoga/common': patch
'@graphql-yoga/node': patch
---

Fix GraphQLYogaError being thrown from contextFactory to be treated as an unexpected error. The bug would previously prevent the GraphQLYogaError `extensions` from being exposed in the result and cause a status code of 500.
