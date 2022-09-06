---
'graphql-yoga': minor
---

- Batching RFC support with `batchingLimit` option to enable batching with an exact limit of requests per batch.
- New `onParams` hook that takes a single `GraphQLParams` object
- Changes in `onRequestParse` and `onRequestParseDone` hook
- - Now `onRequestParseDone` receives the exact object that is passed by the request parser so it can be `GraphQLParams` or an array of `GraphQLParams` so use `onParams` if you need to manipulate batched execution params individually.
