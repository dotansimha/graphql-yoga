import fastify, { FastifyInstance } from 'fastify'
import pino from 'pino'
import { renderGraphiQL, sendResult, shouldRenderGraphiQL } from 'graphql-helix'
import { BaseGraphQLServer, BaseGraphQLServerOptions } from '@graphql-yoga/core'
import { EnvelopError as GraphQLServerError } from '@envelop/core'
import { getHttpRequest } from './request'

export class GraphQLServer extends BaseGraphQLServer {
  private _server: FastifyInstance
  private _getHttpRequest = getHttpRequest

  constructor(options: BaseGraphQLServerOptions) {
    super(options)
    this._server = fastify()
    this.logger = pino({
      prettyPrint: {
        colorize: true,
      },
      level: this.isProd ? 'info' : 'debug',
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
