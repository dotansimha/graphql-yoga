# @graphql-yoga/common

## 0.1.0-beta.8

### Minor Changes

- 6d60ebf: add tabs to GraphiQL
- 0424fe3: feat(common/node): simpler integration

### Patch Changes

- 2b6916f: fix(common): error responses should also have data: null per spec
- d137445: fix(common): encode string before passing in SSE Responses
- 2b6916f: fix(common): correct content-type for error responses
- Updated dependencies [9f628e5]
- Updated dependencies [6d60ebf]
- Updated dependencies [9f628e5]
  - @graphql-yoga/render-graphiql@0.1.0-beta.3

## 0.1.0-beta.7

### Minor Changes

- 14c93a7: enhance: remove pino for Node and use a cross-platform simple logger
- 8ab60cf: feat: dynamic GraphiQL options

## 0.1.0-beta.6

### Minor Changes

- 9a9ac0a: enhance(common): remove readiness/health configuration but use endsWith instead to check paths

## 0.1.0-beta.5

### Minor Changes

- 4e3129d: feat(common): ability to configure health check and readiness check endpoints
- 2a033fb: feat(common): ability to configure parse and validate caching

### Patch Changes

- 5fba736: fix(common/node): seperate generics for server and user context types
- Updated dependencies [f88b30b]
  - @graphql-yoga/render-graphiql@0.1.0-beta.2

## 0.1.0-beta.4

### Minor Changes

- 433558f: feat(common/node): remove lightmyrequest and move inject method to common package

## 0.1.0-beta.3

### Minor Changes

- 62e8c07: feat(common/node): ability to expose Node/env specific additional context with the server handlers

  `handleRequest` of `YogaServer` now takes a second parameter to add an additional context on the server level like below;

  ```ts
  someServer.someServerHandlerMethod(
    (someServerRequest, someServerResponse) => {
      const yogaResponse = await yogaServer.handleRequest(request, {
        someServerRequest
        someServerResponse
      })
      someServer.consumeWhatwgResponse(yogaResponse)
    },
  )
  ```

  So `handleIncomingMessage` of `YogaNodeServer` can accept a second parameter to add Node specific stuff to the context besides WHATWG `Request` object;

  For Fastify:

  ```ts
  app.route({
    url: '/graphql',
    method: ['GET', 'POST', 'OPTIONS'],
    handler: async (req, reply) => {
      // Here `req` and `reply` objects are added to the GraphQL Context
      const response = await graphQLServer.handleIncomingMessage(req, {
        req,
        reply,
      })
      for (const [name, value] of response.headers) {
        reply.header(name, value)
      }

      reply.status(response.status)
      const nodeStream = Readable.from(response.body)
      reply.send(nodeStream)
    },
  })
  ```

  But in this case to improve type safety, it is recommended to add a generic parameter to `createServer` like below:

  ```ts
  const graphQLServer = createServer<{
    req: FastifyRequest
    reply: FastifyReply
  }>({
    logging: fastifyServer.log,
    schema: {
      typeDefs: /* GraphQL */ `
        type Query {
          fooHeader: String
        }
      `,
      resolvers: {
        Query: {
          fooHeader: (root, args, context, info) => {
            // context.req is typed here
            return context.req.headers.foo
          },
        },
      },
    },
  })
  ```

  Default `requestListener` which is used by most of the Node.js servers except Koa and Fastify adds Node's request(`IncomingMessage`) and response(`ServerResponse`) objects to the context as `{ req, res }` automatically without an additional code.

## 0.0.1-beta.2

### Patch Changes

- 11e80ea: Remove "By Helix from debug messages"
- daeea82: fix(common): bump cross-undici-fetch and pass encoding header for wider support
- Updated dependencies [8d03bee]
  - @graphql-yoga/subscription@0.0.1-beta.1

## 0.0.1-beta.1

### Patch Changes

- a665e1e: fix(common): expose CORS headers correctly in regular requests
- Updated dependencies [a665e1e]
  - @graphql-yoga/render-graphiql@0.1.0-beta.1

## 0.0.1-beta.0

### Patch Changes

- de1693e: trigger release
- Updated dependencies [de1693e]
  - @graphql-yoga/render-graphiql@0.0.1-beta.0
  - @graphql-yoga/subscription@0.0.1-beta.0

## 0.2.0-alpha.11

### Minor Changes

- dcaea56: add missing tslib dependency

### Patch Changes

- 84091d2: Fix plugin context types
- Updated dependencies [dcaea56]
  - @graphql-yoga/subscription@0.1.0-alpha.2

## 0.2.0-alpha.10

### Minor Changes

- 890e4ec: feat(common): introduce /readiness and /health endpoints

## 0.2.0-alpha.9

### Patch Changes

- b0b244b: bump cross-undici-fetch

## 0.2.0-alpha.8

### Patch Changes

- f2f6202: fix(common): respect given graphiql options

## 0.2.0-alpha.7

### Minor Changes

- 6750eff: rename `GraphQLServerError` to `GraphQLYogaError`.
- d414f95: **BREAKING** Set `maskedErrors` value to `true` by default for safer defaults.

  **BREAKING** Remove `disableIntrospection`. [Please use `useDisableIntrospection` from `@envelop/disable-introspection` instead.](https://www.envelop.dev/plugins/use-disable-introspection)

- bea2dcc: align envelop types
- fc1f2c7: make options optional
- 603ccd8: feat(handler): refactor processRequest by removing the overhead in context build phase
- e93e62d: **BREAKING** Move `typeDefs` and `resolvers` under the `schema` option.

  ```diff
  const graphQLServer = createServer({
  + schema:
      typeDefs: /* GraphQL */ `
        type Query {
          hello: String
        }
        type Subscription {
          countdown(from: Int!): Int!
        }
      `,
      resolvers: {
        Query: {
          hello: () => 'world',
        },
      },
  + }
  })
  ```

  The `schema` option is now optional and Yoga will use a simple hello world schema if no other schema is provided.

### Patch Changes

- b1facf8: fix(common): bump cross-undici-fetch to fix missing mimetype issue in uploaded files
- b37564e: Enable introspection options
- 5d840d9: better naming: replace introspection option name with disableIntrospection
- a10a16c: Node Server implementation has been moved to `@graphql-yoga/node` package.

  CLI implementation has been moved to
  `graphql-yoga` package.

- Updated dependencies [3e771f5]
- Updated dependencies [f856b58]
- Updated dependencies [3e771f5]
- Updated dependencies [f856b58]
- Updated dependencies [f856b58]
  - @graphql-yoga/subscription@0.1.0-alpha.1

## 0.2.0-alpha.6

### Patch Changes

- 3d54829: enhance: move W3C changes
- Updated dependencies [3d54829]
  - @graphql-yoga/handler@0.2.0-alpha.3

## 0.2.0-alpha.5

### Minor Changes

- 36af58e: export renderGraphiQL function

### Patch Changes

- Updated dependencies [36af58e]
  - @graphql-yoga/handler@0.2.0-alpha.2

## 0.2.0-alpha.4

### Minor Changes

- d2c2d18: expose options for enabling introspection and maskedErrors

## 0.2.0-alpha.3

### Minor Changes

- fb894da: Rename createGraphQLServer to createServer

## 0.2.0-alpha.2

### Minor Changes

- 0edf1f8: feat: options for GraphiQL
- 95e0ac0: feat: remove unnecessary Upload scalar types

### Patch Changes

- Updated dependencies [0edf1f8]
- Updated dependencies [95e0ac0]
  - @graphql-yoga/handler@0.2.0-alpha.1

## 0.2.0-alpha.1

### Minor Changes

- 5de1acf: feat(core): add File and Blob scalars automatically

## 0.2.0-alpha.0

### Minor Changes

- d078e84: Drop fastify and use node-http package
- d8f8a81: feat(core): take typeDefs, resolvers and context as param

### Patch Changes

- Updated dependencies [d078e84]
  - @graphql-yoga/handler@0.2.0-alpha.0
