import type { ServerOptions as BaseServerOptions } from '@graphql-yoga/core'
import type { DocumentNode } from 'graphql'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { IncomingHttpHeaders } from 'http'
import { OutgoingHttpHeaders } from 'http2'
import { ServerOptions as HttpsServerOptions } from 'https'

/**
 * Configuration options for the server
 */
export type ServerOptions<TContext, TRootValue> = BaseServerOptions<
  TContext,
  TRootValue
> & {
  /**
   * GraphQL endpoint
   * Default: `/graphql`
   */
  endpoint?: string
  /**
   * Port to run server
   */
  port?: number
  /**
   * Hostname
   * Default: `localhost`
   */
  hostname?: string
  /**
   * Enable HTTPS
   */
  https?: HttpsServerOptions | boolean
  /**
   * Pretty logging with Pino
   */
  prettyLog?: boolean
  logLevel?: 'debug' | 'info'
}

export type GraphQLServerInject<
  TData = any,
  TVariables = Record<string, any>,
> = {
  /** GraphQL Operation to execute */
  document: string | DocumentNode | TypedDocumentNode<TData, TVariables>
  /** Variables for GraphQL Operation */
  variables?: TVariables
  /** Name for GraphQL Operation */
  operationName?: string
  /** Set any headers for the GraphQL request */
  headers?: IncomingHttpHeaders | OutgoingHttpHeaders | undefined
}
