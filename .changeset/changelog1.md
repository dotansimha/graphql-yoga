---
"@graphql-yoga/plugin-apollo-usage-report": patch
---

fixed: move logic from `onEnveloped` hook to `onParse` hook (`onParseEnd`) which prevents the `operationName` could be missing.
