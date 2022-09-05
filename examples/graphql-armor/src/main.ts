import { createYoga } from 'graphql-yoga'
import { EnvelopArmor } from '@escape.tech/graphql-armor'
import { createServer } from 'http'

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

const yoga = createYoga({
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

const server = createServer(yoga)
server.listen(4000)
