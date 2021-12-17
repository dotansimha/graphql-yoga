import { GraphQLServer, useExtendContext, createPubSub } from "graphql-yoga";

const wait = (time: number) => new Promise((resolve) => setTimeout(resolve, time))

const typeDefs = /* GraphQL */ `
  type Query {
    """
    Simple field that return a "Hello world!" string.
    """
    hello: String!
  }

  type Subscription {
    """
    Count up from 0 to Infinity.
    """
    counter: Int!
    """
    Subscribe to the global counter that can be incremented with the 'incrementGlobalCounter' mutation.
    """
    globalCounter: Int!
  }

  type Mutation {
    """
    Increment the global counter by one. Returns the current global counter value after incrementing.
    """
    incrementGlobalCounter: Int!
  }
`;

let globalCounter = 0

const resolvers = {
  Query: {
    hello: () => `Hello world!`,
  },
  Subscription: {
    counter: {
      subscribe: async function* () {
        let counter = 0;

        // count up until the subscription is terminated
        while (true) {
          yield counter++
          await wait(1000)
        }
      },
      resolve: (payload) => payload,
    },
    globalCounter: {
      subscribe: async function * (_source, _args, context) {
        // as soon as a client subscribes to this field we want to send him the latest value.
        yield globalCounter
        // after the initial value has been sent, we send new values to the client as the counter has been incremented.
        yield* context.pubSub.subscribe("global:counter")
      },
      resolve: (payload) => payload,
    },
  },
  Mutation: {
    incrementGlobalCounter: (_source, _args, context) => {
      globalCounter++
      context.pubSub.publish("global:counter", globalCounter)
      return globalCounter
    }
  },
};

const pubSub = createPubSub<{
  'global:counter': [number],
}>()


const server = new GraphQLServer({
  typeDefs,
  resolvers,
  plugins: [useExtendContext(() => ({ pubSub }))],
});

server.start();
