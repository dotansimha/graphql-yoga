import type { YogaServerOptions } from '@graphql-yoga/common'
import type { FormDataLimits } from 'cross-undici-fetch'
import type { ServerOptions as HttpsServerOptions } from 'https'

/**
 * Configuration options for the server
 */
export type YogaNodeServerOptions<TServerContext, TUserContext, TRootValue> =
  Omit<
    YogaServerOptions<TServerContext, TUserContext, TRootValue>,
    'multipart'
  > & {
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
     * Limits for multipart request parsing
     */
    multipart?: FormDataLimits | boolean
  }

export interface AddressInfo {
  protocol: 'http' | 'https'
  hostname: string
  endpoint: string
  port: number
}
