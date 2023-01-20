import {
  ApolloGateway,
  GraphQLDataSource,
  ServiceEndpointDefinition,
} from '@apollo/gateway'
import { createYoga, isAsyncIterable } from 'graphql-yoga'
import { useApolloFederation } from '@envelop/apollo-federation'
import { GatewayConfig } from '@apollo/gateway'
import { buildHTTPExecutor } from '@graphql-tools/executor-http'
import { parse } from 'graphql'

export function buildService(
  opts: ServiceEndpointDefinition,
): GraphQLDataSource {
  const executor = buildHTTPExecutor({
    endpoint: opts.url,
  })
  return {
    async process(opts) {
      const result = await executor({
        document: parse(opts.request.query),
        operationName: opts.request.operationName,
        variables: opts.request.variables,
        context: opts.context,
        extensions: {
          endpoint: opts.request.http?.url,
          method: opts.request.http?.method as 'POST',
          headers: opts.request.http?.headers as any,
          ...opts.request.extensions,
        },
      })
      if (isAsyncIterable(result)) {
        throw new Error('Async Iterables are not supported')
      }
      return result
    },
  }
}

export async function gateway(config?: GatewayConfig) {
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
