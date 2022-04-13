# @graphql-yoga/node

## 2.2.1

### Patch Changes

- 32e2e40: Bump fixed cross-undici-fetch version
- Updated dependencies [32e2e40]
- Updated dependencies [32e2e40]
  - @graphql-yoga/common@2.2.1

## 2.2.0

### Patch Changes

- 1d4fe42: Use node-fetch by default instead of undici. As discussed in https://github.com/nodejs/undici/issues/1203, `undici`'s fetch implementation has some performance issues compared to `node-fetch` v2.

  So Yoga now uses `node-fetch` by default which doesn't affect the existing users. User can configure `cross-undici-fetch` to revert back this behavior;

  ```ts
  import { create } from 'cross-undici-fetch'

  createServer({
    fetchAPI: create({ useNodeFetch: false }),
  })
  ```

- Updated dependencies [1d4fe42]
- Updated dependencies [1d4fe42]
  - @graphql-yoga/common@2.2.0

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

- 2739db2: Update to latest GraphiQL 1.8.4

### Patch Changes

- cd9394e: Default to endpoint `/graphql` and send 404 if the request endpoint does not match.
- Updated dependencies [b459c9c]
- Updated dependencies [4077773]
- Updated dependencies [f6bcbd1]
- Updated dependencies [2739db2]
- Updated dependencies [e207079]
- Updated dependencies [86edaa3]
  - @graphql-yoga/common@2.1.0

## 2.0.0

### Major Changes

- d414f95: **BREAKING** Set `maskedErrors` value to `true` by default for safer defaults.

  **BREAKING** Remove `disableIntrospection`. [Please use `useDisableIntrospection` from `@envelop/disable-introspection` instead.](https://www.envelop.dev/plugins/use-disable-introspection)

- 133f8e9: feat(node): improve sendNodeResponse
- 14c93a7: enhance: remove pino for Node and use a cross-platform simple logger
- cfec14b: enhance(node): get address info from the socket connection if possible
- 433558f: feat(common/node): remove lightmyrequest and move inject method to common package
- 3c82b57: feat(node): respect parsed request bodies (e.g. graphql-upload)
- dcaea56: feat(node): add getServerUrl that returns expected full GraphQL API URL
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

- ce60a48: fix(node): add import of pino-pretty for the bundler-based envs like Next.JS
- 6d60ebf: add tabs to GraphiQL
- 0424fe3: feat(common/node): simpler integration
- dcaea56: add missing tslib dependency

### Patch Changes

- ec777b1: fix(node): remove port identifier from host header if used as hostname to build Request
- dcaea56: fix(node): use localhost instead of 0.0.0.0 on Windows
- b0b244b: bump cross-undici-fetch
- f5f06f4: fix(node): do not try to print if document is falsy
- 433558f: fix(node): respect body attribute only if request body is json
- 5fba736: fix(common/node): seperate generics for server and user context types
- a8b619b: fix(node): make sure socket object is valid before configuring it
- 44ad1b3: enhance(node): getNodeRequest doesn't need to be async
- de1693e: trigger release
- d60f79f: fix(node): resolve sendNodeResponse correctly when stream has been finished
- daeea82: fix(common): bump cross-undici-fetch and pass encoding header for wider support
- a10a16c: Node Server implementation has been moved to `@graphql-yoga/node` package.

  CLI implementation has been moved to
  `graphql-yoga` package.

- Updated dependencies [6750eff]
- Updated dependencies [0edf1f8]
- Updated dependencies [d414f95]
- Updated dependencies [2b6916f]
- Updated dependencies [14c93a7]
- Updated dependencies [b0b244b]
- Updated dependencies [84091d2]
- Updated dependencies [3e771f5]
- Updated dependencies [d2c2d18]
- Updated dependencies [4e3129d]
- Updated dependencies [36af58e]
- Updated dependencies [433558f]
- Updated dependencies [9256319]
- Updated dependencies [bea2dcc]
- Updated dependencies [e99ec3e]
- Updated dependencies [fc1f2c7]
- Updated dependencies [f856b58]
- Updated dependencies [8d03bee]
- Updated dependencies [f2f6202]
- Updated dependencies [11e80ea]
- Updated dependencies [890e4ec]
- Updated dependencies [fb894da]
- Updated dependencies [603ccd8]
- Updated dependencies [e93e62d]
- Updated dependencies [3d54829]
- Updated dependencies [5de1acf]
- Updated dependencies [8ab60cf]
- Updated dependencies [b1facf8]
- Updated dependencies [3e771f5]
- Updated dependencies [5fba736]
- Updated dependencies [b37564e]
- Updated dependencies [62e8c07]
- Updated dependencies [d078e84]
- Updated dependencies [6d60ebf]
- Updated dependencies [5d840d9]
- Updated dependencies [95e0ac0]
- Updated dependencies [2a033fb]
- Updated dependencies [0424fe3]
- Updated dependencies [d8f8a81]
- Updated dependencies [a665e1e]
- Updated dependencies [de1693e]
- Updated dependencies [f856b58]
- Updated dependencies [f856b58]
- Updated dependencies [d137445]
- Updated dependencies [9a9ac0a]
- Updated dependencies [2b6916f]
- Updated dependencies [dcaea56]
- Updated dependencies [daeea82]
- Updated dependencies [a10a16c]
  - @graphql-yoga/common@0.1.0
  - @graphql-yoga/subscription@0.1.0

## 0.1.0-beta.8

### Minor Changes

- 3c82b57: feat(node): respect parsed request bodies (e.g. graphql-upload)
- 6d60ebf: add tabs to GraphiQL
- 0424fe3: feat(common/node): simpler integration

### Patch Changes

- d60f79f: fix(node): resolve sendNodeResponse correctly when stream has been finished
- Updated dependencies [2b6916f]
- Updated dependencies [6d60ebf]
- Updated dependencies [0424fe3]
- Updated dependencies [d137445]
- Updated dependencies [2b6916f]
  - @graphql-yoga/common@0.1.0-beta.8

## 0.1.0-beta.7

### Minor Changes

- 14c93a7: enhance: remove pino for Node and use a cross-platform simple logger
- 8ab60cf: feat: dynamic GraphiQL options

### Patch Changes

- ec777b1: fix(node): remove port identifier from host header if used as hostname to build Request
- Updated dependencies [14c93a7]
- Updated dependencies [8ab60cf]
  - @graphql-yoga/common@0.1.0-beta.7

## 0.1.0-beta.6

### Patch Changes

- Updated dependencies [9a9ac0a]
  - @graphql-yoga/common@0.1.0-beta.6

## 0.1.0-beta.5

### Minor Changes

- cfec14b: enhance(node): get address info from the socket connection if possible

### Patch Changes

- 5fba736: fix(common/node): seperate generics for server and user context types
- 44ad1b3: enhance(node): getNodeRequest doesn't need to be async
- Updated dependencies [4e3129d]
- Updated dependencies [5fba736]
- Updated dependencies [2a033fb]
  - @graphql-yoga/common@0.1.0-beta.5

## 0.1.0-beta.4

### Minor Changes

- 433558f: feat(common/node): remove lightmyrequest and move inject method to common package

### Patch Changes

- 433558f: fix(node): respect body attribute only if request body is json
- Updated dependencies [433558f]
  - @graphql-yoga/common@0.1.0-beta.4

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

### Patch Changes

- Updated dependencies [62e8c07]
  - @graphql-yoga/common@0.1.0-beta.3

## 0.0.1-beta.2

### Patch Changes

- daeea82: fix(common): bump cross-undici-fetch and pass encoding header for wider support
- Updated dependencies [8d03bee]
- Updated dependencies [11e80ea]
- Updated dependencies [daeea82]
  - @graphql-yoga/subscription@0.0.1-beta.1
  - @graphql-yoga/common@0.0.1-beta.2

## 0.0.1-beta.1

### Patch Changes

- Updated dependencies [a665e1e]
  - @graphql-yoga/common@0.0.1-beta.1

## 0.0.1-beta.0

### Patch Changes

- de1693e: trigger release
- Updated dependencies [de1693e]
  - @graphql-yoga/common@0.0.1-beta.0
  - @graphql-yoga/subscription@0.0.1-beta.0

## 0.1.0-alpha.4

### Minor Changes

- 133f8e9: feat(node): improve sendNodeResponse
- dcaea56: feat(node): add getServerUrl that returns expected full GraphQL API URL
- ce60a48: fix(node): add import of pino-pretty for the bundler-based envs like Next.JS
- dcaea56: add missing tslib dependency

### Patch Changes

- dcaea56: fix(node): use localhost instead of 0.0.0.0 on Windows
- f5f06f4: fix(node): do not try to print if document is falsy
- Updated dependencies [84091d2]
- Updated dependencies [dcaea56]
  - @graphql-yoga/common@0.2.0-alpha.11
  - @graphql-yoga/subscription@0.1.0-alpha.2

## 0.1.0-alpha.3

### Patch Changes

- Updated dependencies [890e4ec]
  - @graphql-yoga/common@0.2.0-alpha.10

## 0.1.0-alpha.2

### Patch Changes

- b0b244b: bump cross-undici-fetch
- Updated dependencies [b0b244b]
  - @graphql-yoga/common@0.2.0-alpha.9

## 0.1.0-alpha.1

### Patch Changes

- Updated dependencies [f2f6202]
  - @graphql-yoga/common@0.2.0-alpha.8

## 0.1.0-alpha.0

### Minor Changes

- d414f95: **BREAKING** Set `maskedErrors` value to `true` by default for safer defaults.

  **BREAKING** Remove `disableIntrospection`. [Please use `useDisableIntrospection` from `@envelop/disable-introspection` instead.](https://www.envelop.dev/plugins/use-disable-introspection)

### Patch Changes

- a10a16c: Node Server implementation has been moved to `@graphql-yoga/node` package.

  CLI implementation has been moved to
  `graphql-yoga` package.

- Updated dependencies [6750eff]
- Updated dependencies [d414f95]
- Updated dependencies [3e771f5]
- Updated dependencies [bea2dcc]
- Updated dependencies [fc1f2c7]
- Updated dependencies [f856b58]
- Updated dependencies [603ccd8]
- Updated dependencies [e93e62d]
- Updated dependencies [b1facf8]
- Updated dependencies [3e771f5]
- Updated dependencies [b37564e]
- Updated dependencies [5d840d9]
- Updated dependencies [f856b58]
- Updated dependencies [f856b58]
- Updated dependencies [a10a16c]
  - @graphql-yoga/common@0.2.0-alpha.7
  - @graphql-yoga/subscription@0.1.0-alpha.1
