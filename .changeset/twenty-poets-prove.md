---
'@graphql-yoga/plugin-response-cache': major
---

New Response Cache Plugin!!!

On top of [`@envelop/response-cache`](https://www.envelop.dev/plugins/use-response-cache), this new plugin allows you to skip execution phase even before all the GraphQL execution phases immediately after the GraphQL request parameters is parsed by Yoga.

Also it doesn't need to have `documentString` stored in somewhere in order to get it back during the execution to generate the cache key.

All the features of the same except for the following:

- `session` factory function takes `GraphQLParams` and `Request` objects instead of GraphQL context as arguments.

  - `type SessionIdFactory = (params: GraphQLParams, request: Request) => Maybe<string>`

- `enabled` function takes `GraphQLParams` and `Request` objects instead of GraphQL context as arguments.
  - `type EnabledFn = (params: GraphQLParams, request: Request) => boolean`
