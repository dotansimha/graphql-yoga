import { createServer, createPubSub } from '@graphql-yoga/node'
import { createRedisEventTarget } from '@graphql-yoga/redis-event-target'
import Redis from 'ioredis'

const publishClient = new Redis()
const subscribeClient = new Redis()

const pubSub = createPubSub<{
  message: [string]
}>({
  eventTarget: createRedisEventTarget({
    publishClient,
    subscribeClient,
  }),
})

const server = createServer<{ pubSub: typeof pubSub }>({
  context: () => ({ pubSub }),
  port: parseInt(process.env.PORT || '4000', 10),
  schema: {
    typeDefs: /* GraphQL */ `
      type Query {
        _: Boolean
      }

      type Subscription {
        message: String!
      }

      type Mutation {
        sendMessage(message: String!): Boolean
      }
    `,
    resolvers: {
      Subscription: {
        message: {
          subscribe: (_, __, context) => context.pubSub.subscribe('message'),
          resolve: (message) => message,
        },
      },
      Mutation: {
        sendMessage(_, { message }, context) {
          context.pubSub.publish('message', message)
        },
      },
    },
  },
})

server.start()
