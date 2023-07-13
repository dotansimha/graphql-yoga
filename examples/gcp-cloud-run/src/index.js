/* eslint-env node */
import { createServer } from 'node:http';
import { createSchema, createYoga } from 'graphql-yoga';

const yoga = createYoga({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        greetings: String
      }
    `,
    resolvers: {
      Query: {
        greetings: () => 'This is the `greetings` field of the root `Query` type',
      },
    },
  }),
});

const server = createServer(yoga);
const port = parseInt(process.env.PORT) || 4000;

server.listen(port, () => {
  console.info(`Server is running on http://localhost:${port}${yoga.graphqlEndpoint}`);
});
