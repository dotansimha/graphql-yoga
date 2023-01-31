/* eslint-disable */
const { createYoga, maskError } = require('graphql-yoga')
const { ApolloGateway, RemoteGraphQLDataSource } = require('@apollo/gateway')
const { useApolloFederation } = require('@envelop/apollo-federation')

module.exports.gateway = async function gateway(config) {
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
    maskedErrors: {
      maskError(error, message, isDev) {
        // Note: it seems like the "useApolloFederation" plugin should do this by default?
        if (error?.extensions?.code === 'DOWNSTREAM_SERVICE_ERROR') {
          return error
        }
        return maskError(error, message, isDev)
      },
    },
  })

  return yoga
}

/**
 * Needed since federation remote data source fetcher
 * doesn't support `application/graphql-response+json` content type
 * By default Yoga uses `application/graphql-response+json` content type as per the GraphQL over HTTP spec
 * https://github.com/apollographql/federation/issues/2161
 */
module.exports.DataSource = class DataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request }) {
    request.http.headers.set('accept', 'application/json')
  }
}
