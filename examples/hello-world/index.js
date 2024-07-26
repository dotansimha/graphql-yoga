/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const { createServer } = require('node:http');
const { createYoga, createSchema } = require('graphql-yoga');
const { renderGraphiQL } = require('@graphql-yoga/render-graphiql');
const { useApolloUsageReport } = require('@graphql-yoga/plugin-apollo-usage-report');

const yoga = createYoga({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        hello(name: String): String!
      }
    `,
    resolvers: {
      Query: {
        hello: (_, { name }) => `Hello ${name || 'World'}`,
      },
    },
  }),
  graphiql: {
    title: 'Hello World',
    defaultQuery: /* GraphQL */ `
      {
        hello
      }
    `,
  },
  renderGraphiQL,
  logging: 'debug',
  plugins: [useApolloUsageReport()],
});

const server = createServer(yoga);
server.listen(4000, () => {
  console.log(`Server is running on http://localhost:4000${yoga.graphqlEndpoint}`);
});
