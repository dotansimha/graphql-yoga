---
'@graphql-yoga/apollo-managed-federation': minor
---

`supergraphManager` option is not available anymore, you can pass `SupergraphManager` directly to
the plugin instead;

```diff
- useManagedFederation({ supergraphManager })
+ useManagedFederation(supergraphManager)
```
