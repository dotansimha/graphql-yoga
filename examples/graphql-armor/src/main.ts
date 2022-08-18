import { createServer } from '@graphql-yoga/node'
import { EnvelopArmor } from '@escape.tech/graphql-armor'

const armor = new EnvelopArmor()
const enhancements = armor.protect()

const booksStore = [
  {
    title: 'The Awakening',
    author: 'Kate Chopin',
  },
  {
    title: 'City of Glass',
    author: 'Paul Auster',
  },
]

const server = createServer({
  plugins: [...enhancements.plugins],
  schema: {
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
  },
})

server.start()
