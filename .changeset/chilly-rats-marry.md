---
'@graphql-yoga/common': minor
---

New `setResult` helper is available in `onRequestParseDone` hook to set `ExecutionResult` before any GraphQL specific process.

You can check `@graphql-yoga/plugin-response-cache`'s implementation to see how it can be useful.

Also now `onResultProcess` and `useResultProcessor` hooks use generics to get more type-safety.
