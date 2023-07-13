import { createSchema, createYoga } from 'graphql-yoga';
import { EnvelopArmor } from '@escape.tech/graphql-armor';

const armor = new EnvelopArmor();
const enhancements = armor.protect();

const booksStore = [
  {
    title: 'The Awakening',
    author: 'Kate Chopin',
  },
  {
    title: 'City of Glass',
    author: 'Paul Auster',
  },
];

export const yoga = createYoga({
  plugins: [...enhancements.plugins],
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Book {
        title: String
        author: String
      }
      type Query {
        books: [Book]
      }
    `,
    resolvers: {
      Query: {
        books: () => booksStore,
      },
    },
  }),
});
