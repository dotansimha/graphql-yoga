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
                countdown(from: Int!): Int!
            }
        `,
        resolvers: {
            Query: {
                hello: () => 'world'
            },
            Subscription: {
                countdown: {
                    subscribe: async function* (_, { from }) {
                        for (let i = from; i >= 0; i--) {
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            yield { countdown: i };
                        }
                    }
                },
            }
        }
    });

    app.use('/graphql', (req, res) => graphQLServer.requestListener(req, res));

    return app
}