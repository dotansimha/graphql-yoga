import http from 'node:http';
import { Readable } from 'node:stream';
import { createSchema, createYoga } from 'graphql-yoga';
import Hapi from '@hapi/hapi';

export async function startApp(port: number) {
  const yoga = createYoga<{ req: Hapi.Request; h: Hapi.ResponseToolkit }>({
    schema: createSchema({
      typeDefs: /* GraphQL */ `
        type Query {
          hello: String!
        }
        type Mutation {
          dontChange: String!
        }
        type Subscription {
          greetings: String!
        }
      `,
      resolvers: {
        Query: {
          hello() {
            return 'world';
          },
        },
        Mutation: {
          dontChange() {
            return 'didntChange';
          },
        },
        Subscription: {
          greetings: {
            async *subscribe() {
              for (const hi of ['Hi', 'Bonjour', 'Hola', 'Ciao', 'Zdravo']) {
                yield { greetings: hi };
              }
            },
          },
        },
      },
    }),
  });

  const server = Hapi.server({ port });

  server.route({
    method: '*',
    path: yoga.graphqlEndpoint,
    options: {
      payload: {
        // let yoga handle the parsing
        output: 'stream',
      },
    },
    handler: async (req, h) => {
      const { status, headers, body } = await yoga.handleNodeRequest(
        // will be an incoming message because the payload output option is stream
        req.payload as http.IncomingMessage,
        { req, h },
      );

      const res = h.response().code(status);
      for (const [key, val] of headers) {
        res.header(key, val);
      }

      return Readable.from(body, {
        // hapi needs the stream not to be in object mode
        objectMode: false,
      });
    },
  });

  await server.start();
  return () => server.stop();
}
