import { createSchema, createYoga } from 'graphql-yoga';

export const yoga = createYoga({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        greetings: String
      }
    `,
    resolvers: {
      Query: {
        greetings: () => 'Hello world!',
      },
    },
  }),
});
