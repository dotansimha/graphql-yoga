import fastify, { FastifyInstance } from 'fastify'
import pino from 'pino'
import { renderGraphiQL, sendResult, shouldRenderGraphiQL } from 'graphql-helix'
import {
  BaseNodeGraphQLServer,
  BaseNodeGraphQLServerOptions,
} from '@graphql-yoga/core'
import { EnvelopError as GraphQLServerError } from '@envelop/core'
import { getHttpRequest } from './request'

/**
 * Configuration options for the server
 */
export type GraphQLServerOptions = BaseNodeGraphQLServerOptions & {}

/**
 * Create a simple yet powerful GraphQL server ready for production workloads.
 * Spec compliant server that supports bleeding edge GraphQL features without any vendor lock-ins.
 *
 * Comes baked in with:
 *
 * - Fastify - Fast an low overhead framework for Node.js
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
  private _server: FastifyInstance
  private _getHttpRequest = getHttpRequest

  constructor(options: GraphQLServerOptions) {
    super({
      ...options,
      // This should make default to dev mode base on environment variable
      isDev: options.isDev ?? process.env.NODE_ENV !== 'production',
    })
    this._server = fastify()
    this.logger = pino({
      prettyPrint: {
        colorize: true,
      },
      level: this.isDev ? 'info' : 'debug',
    })
    this.setup()
  }

  /**
   * Setup endpoint and handlers for server
   */
  private setup() {
    const schema = this.schema
    const handler = this.handleRequest
    const getRequest = this._getHttpRequest
    const envelop = this.envelop
    this.logger.debug('Setting up server.')

    this._server.route({
      method: ['GET', 'POST'],
      url: this.endpoint,
      async handler(req, res) {
        const request = await getRequest(req)
        if (shouldRenderGraphiQL(request)) {
          res.raw.end(renderGraphiQL())
        } else {
          const result = await handler(request, schema, envelop)
          return sendResult(result, res.raw)
        }
      },
    })
  }

  start() {
    this._server.listen(this.port, () => {
      this.logger.info(
        `GraphQL server running at http://localhost:${this.port}${this.endpoint}.`,
      )
    })
  }

  stop() {
    this._server.close().then(
      () => {
        this.logger.info('Shutting down GraphQL server.')
        process.exit(0)
      },
      (err) => {
        this.logger.error(
          'Something went wrong :( trying to shutdown the server.',
          err,
        )
        throw new GraphQLServerError(err)
      },
    )
  }
}

export * from 'graphql'
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
