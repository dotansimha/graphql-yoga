/* eslint-disable */
const { createYoga, maskError } = require('graphql-yoga');
const { ApolloGateway } = require('@apollo/gateway');
const { useApolloFederation } = require('@envelop/apollo-federation');

module.exports.gateway = async function gateway(config) {
  // Initialize the gateway
  const gateway = new ApolloGateway(config);

  // Make sure all services are loaded
  await gateway.load();

  const yoga = createYoga({
    plugins: [
      useApolloFederation({
        gateway,
      }),
    ],
    maskedErrors: {
      maskError(error, message, isDev) {
        // Note: it seems like the "useApolloFederation" plugin should do this by default?
        if (error?.extensions?.code === 'DOWNSTREAM_SERVICE_ERROR') {
          return error;
        }
        return maskError(error, message, isDev);
      },
    },
  });

  return yoga;
};
