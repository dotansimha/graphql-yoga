---
'graphql-yoga': patch
---

Skip validation caching when there is no `schema` specified. This previously caused a cryptic error message when reaching execution/validation without a schema. Now the missing schema error will actually originate from within the `validate` function instead.
