import { GraphQLServer } from 'graphql-yoga';
import fastify from 'fastify';

export function buildApp() {
    const app = fastify({ logger: true });

    const graphQLServer = new GraphQLServer({
        typeDefs: /* GraphQL */ `
        type Query {
            hello: String
        }
        type Subscription {
            count: Int
        }
    `,
        resolvers: {
            Query: {
                hello: () => 'world'
            },
            Subscription: {
                count: {
                    subscribe: async function* () {
                        let count = 0;
                        while (true) {
                            yield { count };
                            count++;
                        }
                    },
                },
            }
        }
    });

    app.route({
        url: '/graphql',
        method: ['GET', 'POST', 'OPTIONS'],
        handler: async (req, reply) => {
            const response = await graphQLServer.handleIncomingMessage(req)
            response.headers.forEach((value, key) => {
                reply.header(key, value);
            });

            reply.status(response.status);
            reply.send(response.body);
        }
    })

    return app
}