import { makeExecutableSchema } from '@graphql-tools/schema'
import { Resolvers } from './resolver-types'

const typeDefs = /* GraphQL */ `
  type Query {
    greeting: String
  }
  type Subscription {
    count(to: Int!): Int
  }
`

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const resolvers: Resolvers = {
  Query: {
    greeting: () => 'Hello world!',
  },
  Subscription: {
    count: {
      subscribe: async function* (_, { to }) {
        for (let i = 0; i <= to; i++) {
          yield { count: i }
          console.log({ count: i })
          sleep(1000)
        }
      },
    },
  },
}

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
})
