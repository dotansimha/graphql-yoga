# @graphql-yoga/common

## 2.10.0

### Minor Changes

- 8947657: ## Correct status code for multipart request errors

  Return correct 413 (Request Entity Too Large) HTTP status code if the given request body is larger then the specified one in `multipart` options.
  Previously it was returning 400 or 500 which is an incorrect behavior misleading the client.

  ## Possible to configure the HTTP status code and headers of the response

  Now we add a new `http` field to `GraphQLErrorExtensions` that you can set the status code and headers of the response;

  ```ts
  throw new GraphQLError('You are not authorized to access this field', {
    extensions: {
      http: {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Bearer',
        },
      },
    },
  })
  ```

## 2.9.0

### Minor Changes

- 7de07cd: Support TypeScript ECMA script resolution. More information on https://devblogs.microsoft.com/typescript/announcing-typescript-4-7/#ecmascript-module-support-in-node-js

### Patch Changes

- 8922c3b: ## Multiple parameters are not recommended (not used internally) for log methods

  Previously sometimes Yoga used to send data to the provided logger like below;

  ```js
  yogaLogger.debug(arg1, arg2, arg3)
  ```

  This behavior is working fine with JavaScript's native `console` implementation but most of the other non native logger implementation like Pino only accept a single parameter for its logging methods. So we decided to avoid sending multiple parameters to the logger.
  However, in order to prevent a breaking change, we kept the signatures of logger methods and they will still accept multiple parameters in a single call. You should keep on mind that eventually we will stop accepting multiple parameters and have the behavior similar to Pino's.

  ## Note for custom logger and fastify users

  We still recommend to update your `logging` parameter in `createServer` call to make sure the other parameters after the first one aren't ignored if exists;

  ```js
  createServer({
    ...someOtherOptions,
    logging: {
      // app.log is Fastify's logger
      // You should replace it with your own if you have some other logger implementation
      debug: (...args) => args.forEach((arg) => app.log.debug(arg)),
      info: (...args) => args.forEach((arg) => app.log.info(arg)),
      warn: (...args) => args.forEach((arg) => app.log.warn(arg)),
      error: (...args) => args.forEach((arg) => app.log.error(arg)),
    },
  })
  ```

  ## No more custom `inspect`

  Previously Yoga's default logger implementation was using a platform independent port of Node's `util.inspect`. It was helping us to mimic `console.log`'s behavior to serialize object in a pretty way. But we no longer use it and pass multiple parameters to `console.log/debug/info/error` instead and leave the serialization to the environment. Don't get confused with the one above :) This is an optimization with default `console` which already supports multiple values. But the improvement above is for non native logger implementations.

- Updated dependencies [7de07cd]
  - @graphql-yoga/subscription@2.1.0

## 2.8.3

### Patch Changes

- 2c0bcda: Remove 'Server: GraphQL Yoga' header from the response

## 2.8.2

### Patch Changes

- a06091f: '.inject' should set Content-Type to application/json by default. Previously the user should have set it.

## 2.8.1

### Patch Changes

- 06652c7: Fix GraphQLYogaError being thrown from contextFactory to be treated as an unexpected error. The bug would previously prevent the GraphQLYogaError `extensions` from being exposed in the result and cause a status code of 500.
- a4960bd: Ensure the GraphiQL version is compatible with the `@graphql-yoga/common` version by hard-coding the version number before publishing/building.

## 2.8.0

### Minor Changes

- c96e7c2: Support `application/graphql`, `application/x-www-form-urlencoded` and `application/graphql+json` as defined in GraphQL over HTTP specification and implemented in `express-graphql` reference implementation so Yoga now accepts the following request bodies with specific "Content-Type" headers;

  - `application/graphql` can accept `query something { somefield }` which takes the GraphQL operation directly as `POST` request body
  - `application/x-www-form-urlencoded` can accept `query=something&variables={"somefield": "somevalue"}` which takes the GraphQL operation and variables as `POST` request body

## 2.7.0

### Minor Changes

- bcda7fd: New "additionalHeaders" property to GraphiQL

## 2.6.1

### Patch Changes

- 0224bf9: prevent exposure of status, header and originalError extensions

## 2.6.0

### Minor Changes

- a7834d6: New Yoga-specific hooks for plugins: onRequestParse & onRequestParseDone
- b8f0680: New Plugin hooks -> onRequest, onResultProcess and onResponse

### Patch Changes

- 0deb5bd: Remove unused dependency

## 2.5.0

### Minor Changes

- f2c9adc: Do not return any CORS headers if CORS options is false

### Patch Changes

- 8b6d896: Now you can configure multipart request parsing limits for file uploads with `multipart` option in `createServer` of @graphql-yoga/node
  You can also disable `multipart` processing by passing `false`.

  ```ts
  createServer({
    multipart: {
      maxFileSize: 2000, // Default: Infinity
    },
  })
  ```

  In `@graphql-yoga/common`'s `createServer`, we can only enable or disable multipart which is enabled by default.

  ```ts
  createServer({
    multipart: false, // enabled by default
  })
  ```

- 6bff871: Refactor CORS and return sent origin if possible

## 2.4.1

### Patch Changes

- 5fd5db4: Send specific origin in CORS instead of wildcard if credentials are allowed explicitly like below;

  ```ts
  createServer({
    cors: {
      origin: ['http://localhost:4000'], // Previously this was ignored even if `credentials` is true
      credentials: true,
    },
  })
  ```

## 2.4.0

### Minor Changes

- 4aaf814: feat(graphiql): ability to choose WS over SSE
- 13f96db: Improve log messages

## 2.3.0

### Minor Changes

- 3740c12: Remove 'chalk' dependency for lower bundle size
- 3740c12: Minify YogaGraphiQL HTML in the code

## 2.2.1

### Patch Changes

- 32e2e40: Thanks to the recent release of DataLoader, we don't need to setImmediate for browser environments anymore.
- 32e2e40: Bump fixed cross-undici-fetch version

## 2.2.0

### Minor Changes

- 1d4fe42: new option `fetchAPI` has been added;

  User can provide a custom Fetch implementation to Yoga like below;

  ```ts
  import { fetch, Request, Response, ReadableStream } from 'my-ponyfill'
  createServer({
    fetchAPI: {
      fetch,
      Request,
      Response,
      ReadableStream,
    },
  })
  ```

### Patch Changes

- 1d4fe42: Avoid extra usages of URL constructor which has some performance implications on Node

## 2.1.0

### Minor Changes

- 4077773: Allow to pass in `graphiql: true` or `graphiql: () => true` as an option to create server.

  This change makes it easier to please the TypeScript compiler for setups that disable YogaGraphiQL conditionally (e.g.g based on environment variables).

  **Previously you had to write:**

  ```ts
  createServer({
    graphiql: process.env.NODE_ENV === "development" ? {} : false
    // OR
    graphiql: process.env.NODE_ENV === "development" ? undefined : false
  });
  ```

  **Now you can write the following:**

  ```ts
  createServer({
    graphiql: process.env.NODE_ENV === 'development',
  })
  ```

- f6bcbd1: Load GraphiQL from CDN in order to reduce bundle size.

  If you need to use GraphiQL in an offline environment please follow the instructions in the docs for installing `@graphql-yoga/render-graphiql`.

  https://www.graphql-yoga.com/docs/features/graphiql#offline-usage

- 2739db2: Update to latest GraphiQL 1.8.4

### Patch Changes

- b459c9c: Generate correct multipart response.
- e207079: Checks if the request url matches with the given endpoint and gives 404 if not.
- 86edaa3: handle cors headers correctly in case of an explicit definition of the allowed origins;

  - If request origin doesn't match with the provided allowed origins, allowed origin header returns null which will cause the client fail.
  - If request origin matches with the provided allowed origins, allowed origin header returns the request origin as it is.
  - - Previously it used to return all origins at once then the client was failing no matter what.
  - If no request origin is provided by the request, allowed origin header returns '\*'.
  - - If credentials aren't explicitly allowed and request origin is missing in the headers, credentials header returns 'false' because '\*' and credentials aren't allowed per spec.

## 2.0.0

### Major Changes

- 6750eff: rename `GraphQLServerError` to `GraphQLYogaError`.
- 0edf1f8: feat: options for GraphiQL
- d414f95: **BREAKING** Set `maskedErrors` value to `true` by default for safer defaults.

  **BREAKING** Remove `disableIntrospection`. [Please use `useDisableIntrospection` from `@envelop/disable-introspection` instead.](https://www.envelop.dev/plugins/use-disable-introspection)

- 14c93a7: enhance: remove pino for Node and use a cross-platform simple logger
- d2c2d18: expose options for enabling introspection and maskedErrors
- 4e3129d: feat(common): ability to configure health check and readiness check endpoints
- 36af58e: export renderGraphiQL function
- 433558f: feat(common/node): remove lightmyrequest and move inject method to common package
- bea2dcc: align envelop types
- fc1f2c7: make options optional
- 890e4ec: feat(common): introduce /readiness and /health endpoints
- fb894da: Rename createGraphQLServer to createServer
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

- 5de1acf: feat(core): add File and Blob scalars automatically
- 8ab60cf: feat: dynamic GraphiQL options
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

- d078e84: Drop fastify and use node-http package
- 6d60ebf: add tabs to GraphiQL
- 95e0ac0: feat: remove unnecessary Upload scalar types
- 2a033fb: feat(common): ability to configure parse and validate caching
- 0424fe3: feat(common/node): simpler integration
- d8f8a81: feat(core): take typeDefs, resolvers and context as param
- 9a9ac0a: enhance(common): remove readiness/health configuration but use endsWith instead to check paths
- dcaea56: add missing tslib dependency

### Patch Changes

- 2b6916f: fix(common): error responses should also have data: null per spec
- b0b244b: bump cross-undici-fetch
- 84091d2: Fix plugin context types
- 9256319: Fix type for graphiql option
- f2f6202: fix(common): respect given graphiql options
- 11e80ea: Remove "By Helix from debug messages"
- 3d54829: enhance: move W3C changes
- b1facf8: fix(common): bump cross-undici-fetch to fix missing mimetype issue in uploaded files
- 5fba736: fix(common/node): seperate generics for server and user context types
- b37564e: Enable introspection options
- 5d840d9: better naming: replace introspection option name with disableIntrospection
- a665e1e: fix(common): expose CORS headers correctly in regular requests
- de1693e: trigger release
- d137445: fix(common): encode string before passing in SSE Responses
- 2b6916f: fix(common): correct content-type for error responses
- daeea82: fix(common): bump cross-undici-fetch and pass encoding header for wider support
- a10a16c: Node Server implementation has been moved to `@graphql-yoga/node` package.

  CLI implementation has been moved to
  `graphql-yoga` package.

- Updated dependencies [3e771f5]
- Updated dependencies [e99ec3e]
- Updated dependencies [f88b30b]
- Updated dependencies [f856b58]
- Updated dependencies [8d03bee]
- Updated dependencies [a665e1e]
- Updated dependencies [9f628e5]
- Updated dependencies [3e771f5]
- Updated dependencies [6d60ebf]
- Updated dependencies [de1693e]
- Updated dependencies [f856b58]
- Updated dependencies [f856b58]
- Updated dependencies [9f628e5]
- Updated dependencies [dcaea56]
  - @graphql-yoga/subscription@0.1.0
  - @graphql-yoga/render-graphiql@0.1.0

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
