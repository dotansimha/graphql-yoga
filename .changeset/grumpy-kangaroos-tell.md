---
'graphql-yoga': patch
---

`usePreventMutationViaGET` doesn't do assertion if it is not `YogaContext`, so it is possible to use Yoga's Envelop instance with other server implementations like `graphql-ws`.
