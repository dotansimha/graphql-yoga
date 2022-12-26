import { createServer } from 'http'
import { createYoga, createSchema } from 'graphql-yoga'
import { useResponseCache } from '@graphql-yoga/plugin-response-cache'

const schema = createSchema({
  typeDefs: `
        type Query {
            me: User
        }
        type User {
            id: ID!
            name: String!
        }
    `,
  resolvers: {
    Query: {
      me: () => {
        console.count('Query.me')
        return {
          id: '1',
          name: 'Bob',
        }
      },
    },
  },
})

const yoga = createYoga({
  schema,
  plugins: [
    useResponseCache({
      session: () => null,
      includeExtensionMetadata: true,
    }),
  ],
})

const server = createServer(yoga)

server.listen(4000, () => {
  console.log('Server is running on http://localhost:4000')
})
