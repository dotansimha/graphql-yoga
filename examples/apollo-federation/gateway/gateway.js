const { createYoga } = require('graphql-yoga')
const { ApolloGateway } = require('@apollo/gateway')
const { useApolloFederation } = require('@envelop/apollo-federation')

export async function gateway(config) {
  // Initialize the gateway
  const gateway = new ApolloGateway(config)

  // Make sure all services are loaded
  await gateway.load()

  const yoga = createYoga({
    plugins: [
      useApolloFederation({
        gateway,
      }),
    ],
  })

  return yoga
}
