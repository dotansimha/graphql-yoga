import { GraphQLServer } from 'graphql-yoga';
import express from 'express';

export function buildApp() {
    const app = express();

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

    app.use('/graphql', (req, res) => graphQLServer.requestListener(req, res));

    return app
}