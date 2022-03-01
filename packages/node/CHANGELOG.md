# @graphql-yoga/node

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
