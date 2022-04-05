import type { YogaServerOptions } from '@graphql-yoga/common'
import { ServerOptions as HttpsServerOptions } from 'https'

/**
 * Configuration options for the server
 */
export type YogaNodeServerOptions<TServerContext, TUserContext, TRootValue> =
  YogaServerOptions<TServerContext, TUserContext, TRootValue> & {
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
  }

export interface AddressInfo {
  protocol: 'http' | 'https'
  hostname: string
  endpoint: string
  port: number
}
