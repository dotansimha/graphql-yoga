import fastify, { FastifyInstance } from 'fastify'
import pino from 'pino'
import {
  getNodeRequest,
  renderGraphiQL,
  shouldRenderGraphiQL,
} from '@ardatan/graphql-helix'
import { BaseNodeGraphQLServer } from '@graphql-yoga/core'
import { EnvelopError as GraphQLServerError } from '@envelop/core'
import { GraphQLScalarType } from 'graphql'
import type { GraphQLServerInject, GraphQLServerOptions } from './types'

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
      enabled: options.enableLogging ?? true,
    })

    this.logger.debug('Registering CORS plugin.')
    this._server.register(require('fastify-cors'), options.cors)

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

    this._server.addContentTypeParser('multipart/form-data', (request, body, done) => {
      done(null)
    })

    this._server.route({
      method: ['GET', 'POST'],
      url: this.endpoint,
      async handler(req, reply) {
        const request = await getNodeRequest(req)

        if (shouldRenderGraphiQL(request)) {
          reply.type("text/html");
          reply.send(renderGraphiQL({}));
        } else {
          const response = await handler(request, schema, envelop)

          response.headers.forEach((value, key) => {
            reply.header(key, value);
          });

          reply.status(response.status);
          reply.send(response.body);
          reply.sent = true;
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

  get fastify() {
    return this._server
  }

  /**
   * Testing utility to mock http request for GraphQL endpoint
   * This is a thin wrapper around the `fastify.inject()` to help simplify testing.
   *
   *
   * Example - Test a simple query
   * ```ts
   * const response = await yoga.inject({
   *  operation: "query { ping }",
   * })
   * expect(response.statusCode).toBe(200)
   * expect(response.data.ping).toBe('pong')
   * ```
   */
  async inject<TData = any, TVariables = any>({
    document,
    headers,
    variables,
    operationName,
  }: GraphQLServerInject<TData, TVariables>) {
    const res = await this._server.inject({
      method: 'POST',
      url: this.endpoint,
      payload: {
        query: document,
        variables,
        operationName,
      },
      headers,
    })

    // In failed requests res.json() will throw an error
    // So we just parse the body ourselves
    const body = JSON.parse(res.body)

    return {
      statusCode: res.statusCode,
      headers: res.headers,
      data: body?.data as TData,
      errors: body?.errors as Error[],
    }
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

export const GraphQLUpload = new GraphQLScalarType({
  name: 'Upload',
  serialize: (value) => value,
  parseValue: (value) => value,
})
