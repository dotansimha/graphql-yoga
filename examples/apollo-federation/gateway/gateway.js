/* eslint-disable */
const { createYoga } = require('graphql-yoga')
const { ApolloGateway, RemoteGraphQLDataSource } = require('@apollo/gateway')
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

/**
 * Needed since federation remote data source fetcher
 * doesn't support `application/graphql-response+json` content type
 * By default Yoga uses `application/graphql-response+json` content type as per the GraphQL over HTTP spec
 * https://github.com/apollographql/federation/issues/2161
 */
export class DataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request }) {
    request.http.headers.set('accept', 'application/json')
  }
}
