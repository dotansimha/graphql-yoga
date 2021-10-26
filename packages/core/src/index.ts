import fastify, { FastifyInstance } from 'fastify'
import { getHttpRequest } from '@graphql-yoga/handler'
import { BaseGraphQLServer, GraphQLServerOptions } from './base'

export class GraphQLServer extends BaseGraphQLServer {
  private _server: FastifyInstance
  private _getHttpRequest = getHttpRequest

  constructor(options: GraphQLServerOptions) {
    super(options)
    this._server = fastify()
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

    this._server.route({
      method: ['GET', 'POST'],
      url: this.endpoint,
      async handler(req, res) {
        const request = await getRequest(req)
        handler(request, res.raw, schema, envelop)
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
        process.exit(-1)
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
} from '@envelop/core'
