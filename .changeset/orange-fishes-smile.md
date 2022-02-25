---
'@graphql-yoga/common': minor
'@graphql-yoga/node': minor
---

feat(common/node): ability to expose Node/env specific additional context with the server handlers

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

For Fastify;

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

But in this case to improve type safety, it is recommended to add a generic parameter to `createServer` like below;

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
