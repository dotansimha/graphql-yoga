import {
  createServer as createHttpServer,
  IncomingMessage,
  Server as NodeServer,
  ServerResponse,
} from 'http'
import { createServer as createHttpsServer } from 'https'
import pino from 'pino'
import { getNodeRequest, sendNodeResponse } from './http-utils'
import { Server as BaseServer, YogaLogger } from '@graphql-yoga/core'
import { EnvelopError as GraphQLServerError } from '@envelop/core'
import type { GraphQLServerInject, ServerOptions } from './types'
import LightMyRequest from 'light-my-request'
import { ExecutionResult, print } from 'graphql'

function getPinoLogger<TContext>(options: ServerOptions<TContext>): YogaLogger {
  const prettyLog = options.prettyLog ?? process.env.NODE_ENV !== 'production'
  const logLevel =
    options.logLevel ?? process.env.NODE_ENV !== 'production' ? 'debug' : 'info'

  const prettyPrintOptions = prettyLog
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

  return pino({
    ...prettyPrintOptions,
    level: logLevel,
    enabled: true,
  })
}

class Server<TContext> extends BaseServer<TContext> {
  /**
   * Port for server
   */
  private port: number
  /**
   * GraphQL Endpoint
   */
  private endpoint: string
  /**
   * Hostname for server
   */
  private hostname: string
  private _server: NodeServer

  constructor(options: ServerOptions<TContext>) {
    super({
      ...options,
      logger: options.logger || getPinoLogger(options),
    })
    this.port = options.port || parseInt(process.env.PORT || '4000')
    this.endpoint = options.endpoint || '/graphql'
    this.hostname = options.hostname || '0.0.0.0'

    this.logger.debug('Setting up server.')

    if (options.https) {
      this._server =
        typeof options.https === 'object'
          ? createHttpsServer(options.https, this.requestListener)
          : createHttpsServer(this.requestListener)
    } else {
      this._server = createHttpServer(this.requestListener)
    }

    if (this.graphiql) {
      this.graphiql.endpoint = this.endpoint
    }
  }

  async handleIncomingMessage(
    ...args: Parameters<typeof getNodeRequest>
  ): Promise<Response> {
    this.logger.debug('Node Request received')
    const request = await getNodeRequest(...args)
    this.logger.debug('Node Request processed')
    const response = await this.handleRequest(request)
    this.logger.debug('Response returned')
    return response
  }

  requestListener = async (req: IncomingMessage, res: ServerResponse) => {
    const response = await this.handleIncomingMessage(req)
    await sendNodeResponse(response, res)
  }

  get server() {
    return this._server
  }

  start(
    callback: VoidFunction = () => {
      this.logger.info(
        `GraphQL Server running at http://${this.hostname}:${this.port}${this.endpoint}.`,
      )
    },
  ) {
    return new Promise<void>((resolve) => {
      this._server.listen(this.port, this.hostname, () => {
        callback()
        resolve()
      })
    })
  }

  stop(
    callback: (err?: Error) => void = (err) => {
      if (err) {
        this.logger.error(
          'Something went wrong :( trying to shutdown the server.',
          err,
        )
      } else {
        this.logger.info('Shutting down GraphQL server.')
      }
    },
  ) {
    return new Promise<void>((resolve, reject) => {
      this._server.close((err) => {
        callback(err)
        if (err != null) {
          reject(new GraphQLServerError(err.message))
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * Testing utility to mock http request for GraphQL endpoint
   *
   *
   * Example - Test a simple query
   * ```ts
   * const response = await yoga.inject({
   *  document: "query { ping }",
   * })
   * expect(response.statusCode).toBe(200)
   * expect(response.data.ping).toBe('pong')
   * ```
   **/
  async inject<TData = any, TVariables = any>({
    document,
    variables,
    operationName,
    headers,
  }: GraphQLServerInject<TData, TVariables>): Promise<{
    response: LightMyRequest.Response
    executionResult: ExecutionResult<TData>
  }> {
    const response = await LightMyRequest.inject(this.requestListener as any, {
      method: 'POST',
      url: this.endpoint,
      headers,
      payload: JSON.stringify({
        query: typeof document === 'string' ? document : print(document),
        variables,
        operationName,
      }),
    })
    return {
      response,
      get executionResult() {
        return JSON.parse(response.payload)
      },
    }
  }
}

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
 *  const server = createServer({ schema })
 *  // Start the server. Defaults to http://localhost:4000/graphql
 *  server.start()
 * ```
 */
export function createServer<TContext>(options: ServerOptions<TContext>) {
  return new Server<TContext>(options)
}

export type { ServerOptions } from './types'
export * from '@graphql-yoga/subscription'

export * from '@envelop/core'
export { EnvelopError as GraphQLServerError } from '@envelop/core'
export { renderGraphiQL } from '@graphql-yoga/handler'
