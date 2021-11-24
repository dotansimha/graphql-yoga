import fastify, { FastifyInstance } from 'fastify'
import pino from 'pino'
import {
  getNodeRequest,
  renderGraphiQL,
  sendNodeResponse,
  shouldRenderGraphiQL,
} from 'graphql-helix'
import {
  BaseNodeGraphQLServer,
  BaseNodeGraphQLServerOptions,
} from '@graphql-yoga/core'
import { EnvelopError as GraphQLServerError } from '@envelop/core'
import type { FastifyCorsOptions } from 'fastify-cors'
import { processRequest } from 'graphql-upload'

/**
 * Configuration options for the server
 */
export type GraphQLServerOptions = BaseNodeGraphQLServerOptions & {
  cors?: FastifyCorsOptions
  uploads?: boolean
}

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

  constructor(options: GraphQLServerOptions) {
    super({
      ...options,
      // This should make default to dev mode base on environment variable
      isDev: options.isDev ?? process.env.NODE_ENV !== 'production',
    })
    this._server = fastify()

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
    })

    this.logger.debug('Registering CORS plugin.')
    this._server.register(require('fastify-cors'), options.cors)

    if (options.uploads) {
      this.logger.debug('Registering GraphQL Upload plugin.')

      this._server.addContentTypeParser('multipart', (req, _, done) => {
        // @ts-expect-error - we add this custom property to the request
        req.isMultipart = true
        done(null)
      })

      this._server.addHook('preValidation', async (req, reply) => {
        // TODO: improve typings for this
        // @ts-expect-error - we added this custom property to the request
        if (!req.isMultipart) return
        this.logger.debug(req.body)
        try {
          req.body = await processRequest(req.raw, reply.raw)
          this.logger.info(req.body)
        } catch (e) {
          this.logger.error(e)
        }
      })
    }

    this.setup()
  }

  /**
   * Setup endpoint and handlers for server
   */
  private setup() {
    const schema = this.schema
    const handler = this.handleRequest
    const envelop = this.envelop
    this.logger.debug('Setting up server.')

    this._server.route({
      method: ['GET', 'POST'],
      url: this.endpoint,
      async handler(req, res) {
        const request = await getNodeRequest(req)

        if (shouldRenderGraphiQL(request)) {
          res.raw.end(renderGraphiQL())
        } else {
          const result = await handler(request, schema, envelop)

          /**
           * Get headers from Fastify response to raw response
           * Workaround for helix to use fastify middleware
           * @see https://github.com/contra/graphql-helix/issues/75#issuecomment-976499958
           */
          for (const [key, value] of Object.entries(res.getHeaders())) {
            res.raw.setHeader(key, String(value || ''))
          }

          return sendNodeResponse(result, res.raw)
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
export { GraphQLUpload } from 'graphql-upload'
