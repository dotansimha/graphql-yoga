import type { YogaServerOptions } from '@graphql-yoga/common'
import type { DocumentNode } from 'graphql'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { IncomingHttpHeaders } from 'http'
import { OutgoingHttpHeaders } from 'http2'
import { ServerOptions as HttpsServerOptions } from 'https'

/**
 * Configuration options for the server
 */
export type YogaNodeServerOptions<TAdditionalContext, TRootValue> = Omit<
  YogaServerOptions<TAdditionalContext, TRootValue>,
  'logging'
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
  logging?:
    | YogaServerOptions<TAdditionalContext, TRootValue>['logging']
    | {
        prettyLog?: boolean
        logLevel?: 'debug' | 'info'
      }
}

export interface AddressInfo {
  protocol: 'http' | 'https'
  hostname: string
  endpoint: string
  port: number
}
