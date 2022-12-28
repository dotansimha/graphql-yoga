import { createYoga, createSchema, createGraphQLError } from 'graphql-yoga'
import { fetch } from '@whatwg-node/fetch'
import { useDebugApi } from '@graphql-yoga/plugin-debug-api'

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
export const yoga = createYoga({
  plugins: [
    useDebugApi({
      endpoint: '/test',
    }),
  ],
  schema: createSchema({
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
          const greeting = await fetch('http://localhost:9999/greeting').then(
            (res) => res.text(),
          )

          return greeting
        },
        user: async (_, args) => {
          const user = users.find((user) => user.id === args.byId)
          if (!user) {
            throw createGraphQLError(`User with id '${args.byId}' not found.`, {
              extensions: {
                code: 'USER_NOT_FOUND',
                someRandomExtensions: {
                  aaaa: 3,
                },
              },
            })
          }

          return user
        },
      },
    },
  }),
  logging: true,
  maskedErrors: true,
})
