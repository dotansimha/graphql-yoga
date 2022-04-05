import { createServer } from '@graphql-yoga/node'
import { useLiveQuery } from '@envelop/live-query'
import { InMemoryLiveQueryStore } from '@n1ru4l/in-memory-live-query-store'
import { GraphQLLiveDirective } from '@n1ru4l/graphql-live-query'
import { print } from 'graphql'
import { astFromDirective } from '@graphql-tools/utils'

const liveQueryStore = new InMemoryLiveQueryStore()

setInterval(() => {
  const firstElement = greetings.pop()
  greetings.unshift(firstElement!)
  liveQueryStore.invalidate('Query.greetings')
}, 1000).unref()

const greetings = ['Hi', 'Hello', 'Sup']

const server = createServer({
  context: () => ({ greetings }),
  schema: {
    typeDefs: [
      /* GraphQL */ `
        type Query {
          greetings: [String]!
        }
      `,
      print(astFromDirective(GraphQLLiveDirective)),
    ],
    resolvers: {
      Query: {
        greetings: (_, __, context) => context.greetings,
      },
    },
  },
  graphiql: {
    defaultQuery: /* GraphQL */ `
      query @live {
        greetings
      }
    `,
  },
  plugins: [useLiveQuery({ liveQueryStore })],
})

server.start()
