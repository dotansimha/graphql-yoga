import { createServer } from 'http'

import { useLiveQuery } from '@envelop/live-query'
import { astFromDirective } from '@graphql-tools/utils'
import { GraphQLLiveDirective } from '@n1ru4l/graphql-live-query'
import { InMemoryLiveQueryStore } from '@n1ru4l/in-memory-live-query-store'
import { createSchema, createYoga } from 'graphql-yoga'

const liveQueryStore = new InMemoryLiveQueryStore()

setInterval(() => {
  const firstElement = greetings.pop()
  greetings.unshift(firstElement!)
  liveQueryStore.invalidate('Query.greetings')
}, 1000).unref()

const greetings = ['Hi', 'Hello', 'Sup']

const yoga = createYoga<{ greetings: Array<string> }>({
  context: () => ({ greetings }),
  schema: createSchema({
    typeDefs: [
      /* GraphQL */ `
        type Query {
          greetings: [String]!
        }
      `,
      astFromDirective(GraphQLLiveDirective),
    ],
    resolvers: {
      Query: {
        greetings: (_, __, context) => context.greetings,
      },
    },
  }),
  graphiql: {
    defaultQuery: /* GraphQL */ `
      query @live {
        greetings
      }
    `,
  },
  plugins: [useLiveQuery({ liveQueryStore })],
})

const server = createServer(yoga)
server.listen(4000, () => {
  console.info('Server is running on http://localhost:4000/graphql')
})
