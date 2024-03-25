import fastify, { FastifyReply, FastifyRequest } from 'fastify';
import { createSchema, createYoga } from 'graphql-yoga';

export function buildApp(logging = true) {
  const app = fastify({
    logger: logging && {
      transport: {
        target: 'pino-pretty',
      },
      level: 'debug',
    },
  });

  const graphQLServer = createYoga<{
    req: FastifyRequest;
    reply: FastifyReply;
  }>({
    schema: createSchema({
      typeDefs: /* GraphQL */ `
        scalar File

        type Query {
          hello: String
          isFastify: Boolean
          slow: Nested
        }
        type Mutation {
          hello: String
          getFileName(file: File!): String
        }
        type Subscription {
          countdown(from: Int!, interval: Int!): Int!
        }

        type Nested {
          field: String
        }
      `,
      resolvers: {
        Query: {
          hello: () => 'world',
          isFastify: (_, __, context) => !!context.req && !!context.reply,
          async slow(_, __, context) {
            context.req.log.info('Slow resolver invoked resolved');
            await new Promise<void>((res, reject) => {
              const timeout = setTimeout(() => {
                context.req.log.info('Slow field resolved');
                res();
              }, 1000);

              context.request.signal.addEventListener('abort', () => {
                context.req.log.info('Slow field got cancelled');
                clearTimeout(timeout);
                reject(context.request.signal.reason);
              });
            });

            return {};
          },
        },
        Mutation: {
          hello: () => 'world',
          getFileName: (_, { file }: { file: File }) => file.name,
        },
        Subscription: {
          countdown: {
            async *subscribe(_, { from, interval }) {
              for (let i = from; i >= 0; i--) {
                await new Promise(resolve => setTimeout(resolve, interval ?? 1000));
                yield { countdown: i };
              }
            },
          },
        },
        Nested: {
          field(_, __, context) {
            context.req.log.info('Nested resolver called');
          },
        },
      },
    }),
    // Integrate Fastify Logger to Yoga
    logging: {
      debug: (...args) => {
        for (const arg of args) app.log.debug(arg);
      },
      info: (...args) => {
        for (const arg of args) app.log.info(arg);
      },
      warn: (...args) => {
        for (const arg of args) app.log.warn(arg);
      },
      error: (...args) => {
        for (const arg of args) app.log.error(arg);
      },
    },
  });

  app.addContentTypeParser('multipart/form-data', {}, (_req, _payload, done) => done(null));

  app.route({
    url: graphQLServer.graphqlEndpoint,
    method: ['GET', 'POST', 'OPTIONS'],
    handler: async (req, reply) => {
      const response = await graphQLServer.handleNodeRequestAndResponse(req, reply, {
        req,
        reply,
      });
      for (const [name, value] of response.headers) {
        reply.header(name, value);
      }

      reply.status(response.status);

      reply.send(response.body);

      return reply;
    },
  });

  return [app, graphQLServer.graphqlEndpoint] as const;
}
