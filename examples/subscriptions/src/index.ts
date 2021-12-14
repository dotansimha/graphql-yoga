import { GraphQLServer, useExtendContext, createChannelPubSub } from "graphql-yoga";

const typeDefs = `
  type Query {
    hello: String!
  }

  type Subscription {
    counter: Int!
  }
`;

const resolvers = {
  Query: {
    hello: () => `Hello`,
  },
  Subscription: {
    counter: {
      subscribe: (_, __, { pubSub, logger }) => {
        // Create a random channel so each request gets its own subscription.
        // In real life, this can be dependent on the user's session.
        const channelName = `counter:${(Math.random() * 2).toString()}`;
        let count = 0;
        logger.info(`Subscribing to ${channelName}`);
        setInterval(() => pubSub.publish(channelName, count++), 1000);
        return pubSub.subscribe(channelName);
      },
      resolve: (payload) => payload,
    },
  },
};

const server = new GraphQLServer({
  typeDefs,
  resolvers,
  plugins: [useExtendContext(() => ({ pubSub: createChannelPubSub() }))],
});

server.start();
