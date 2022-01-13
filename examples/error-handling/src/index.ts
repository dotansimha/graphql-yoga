import { createServer, GraphQLYogaError } from 'graphql-yoga'
import { fetch } from 'cross-undici-fetch'

const users = [
  {
    id: '1',
    login: 'Laurin',
  },
  {
    id: '2',
    login: 'Saihaj',
  },
  {
    id: '3',
    login: 'Dotan',
  },
]

// Provide your schema
const server = createServer({
  schema: {
    typeDefs: /* GraphQL */ `
      type User {
        id: ID!
        login: String!
      }
      type Query {
        greeting: String!
        user(byId: ID!): User!
      }
    `,
    resolvers: {
      Query: {
        greeting: async () => {
          // This service does not exist
          const greeting = await fetch('http://localhost:9876/greeting').then(
            (res) => res.text(),
          )

          return greeting
        },
        user: async (_, args) => {
          const user = users.find((user) => user.id === args.byId)
          if (!user) {
            throw new GraphQLYogaError(
              `User with id '${args.byId}' not found.`,
              {
                code: 'USER_NOT_FOUND',
                someRandomExtensions: {
                  aaaa: 3,
                },
              },
            )
          }

          return user
        },
      },
    },
  },
  logging: true,
  maskedErrors: true,
})

// Start the server and explore http://localhost:4000/graphql
server.start()
