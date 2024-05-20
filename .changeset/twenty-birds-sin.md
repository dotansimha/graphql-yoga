---
'@graphql-yoga/plugin-response-cache': patch
---

Now `enabled` and `session` factory functions take a second parameter `ServerContext` that includes the server specific context object. But this object is not the one provided by the user. [Learn more about the difference between the server context and the user context](https://the-guild.dev/graphql/yoga-server/docs/features/context#advanced-context-life-cycle)
