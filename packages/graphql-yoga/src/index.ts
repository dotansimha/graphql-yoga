import { createServer, IncomingMessage, Server, ServerResponse } from 'http'
import pino from 'pino'
import {
  getNodeRequest,
  sendNodeResponse,
} from '@ardatan/graphql-helix'
import { BaseNodeGraphQLServer } from '@graphql-yoga/core'
import { EnvelopError as GraphQLServerError } from '@envelop/core'
import type { GraphQLServerOptions } from './types'

/**
 * Create a simple yet powerful GraphQL server ready for production workloads.
 * Spec compliant server that supports bleeding edge GraphQL features without any vendor lock-ins.
 *
 * Comes baked in with:
 *
 * - Envelop - Plugin system for GraphQL
 * - GraphQL Helix - Extensible and Framework agnostic GraphQL server
 * - GraphiQL - GraphQL IDE for your browser
 * - Pino - Super fast, low overhead Node.js logger
 *
 * Example:
 * ```ts
 *  import { schema } from './schema'
 *   // Provide a GraphQL schema
 *  const server = new GraphQLServer({ schema })
 *  // Start the server. Defaults to http://localhost:4000/graphql
 *  server.start()
 * ```
 */
export class GraphQLServer extends BaseNodeGraphQLServer {
  private _server: Server

  constructor(options: GraphQLServerOptions) {
    super({
      ...options,
      // This should make default to dev mode base on environment variable
      isDev: options.isDev ?? process.env.NODE_ENV !== 'production',
    })

    // Pretty printing only in dev
    const prettyPrintOptions = this.isDev
      ? {
        transport: {
          target: 'pino-pretty',
          options: {
            translateTime: true,
            colorize: true,
          },
        },
      }
      : {}

    this.logger = pino({
      ...prettyPrintOptions,
      level: this.isDev ? 'debug' : 'info',
      enabled: options.enableLogging ?? true,
    })

    this.logger.debug('Setting up server.')

    this._server = createServer(this.requestListener.bind(this))
  }

  private async requestListener(req: IncomingMessage, res: ServerResponse) {
    try {
      const request = await getNodeRequest(req)
      const response = await this.handleRequest(request)
      await sendNodeResponse(response, res)
    } catch (err: any) {
      this.logger.error(err.message, err)
      res.statusCode = 500
      res.end(err.message)
    }
  }

  get server() {
    return this._server
  }

  start() {
    return new Promise<void>((resolve) => {
      this._server.listen(this.port, this.hostname, () => {
        this.logger.info(
          `GraphQL server running at http://${this.hostname}:${this.port}${this.endpoint}.`,
        )
        resolve()
      })
    })
  }

  stop() {
    return new Promise<void>((resolve, reject) => {
      this._server.close((err) => {
        if (err != null) {
          this.logger.error(
            'Something went wrong :( trying to shutdown the server.',
            err,
          )
          reject(new GraphQLServerError(err.message))
        } else {
          this.logger.info('Shutting down GraphQL server.')
          resolve()
        }
      })
    })
  }
}

export type { GraphQLServerOptions } from './types'
export {
  Plugin,
  enableIf,
  envelop,
  useEnvelop,
  usePayloadFormatter,
  useExtendContext,
  useTiming,
  EnvelopError as GraphQLServerError,
} from '@envelop/core'
