import type { BaseNodeGraphQLServerOptions } from '@graphql-yoga/core'

/**
 * Configuration options for the server
 */
export type GraphQLServerOptions = BaseNodeGraphQLServerOptions & {
  /**
   * Enable pino logging
   * @default true
   */
  enableLogging?: boolean
}
