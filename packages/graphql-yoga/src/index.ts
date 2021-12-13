import { createServer, IncomingMessage, Server, ServerResponse } from 'http'
import { createServer as createHttpsServer } from 'https'
import pino from 'pino'
import { getNodeRequest, sendNodeResponse } from '@ardatan/graphql-helix'
import { BaseGraphQLServer } from '@graphql-yoga/core'
import { EnvelopError as GraphQLServerError } from '@envelop/core'
import type { GraphQLServerInject, GraphQLServerOptions } from './types'
import LightMyRequest from 'light-my-request'
import { ExecutionResult, print } from 'graphql'

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
export class GraphQLServer<TContext> extends BaseGraphQLServer<TContext> {
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

  private _server: Server

  constructor(options: GraphQLServerOptions<TContext>) {
    super({
      ...options,
      // This should make default to dev mode base on environment variable
      isDev: options.isDev ?? process.env.NODE_ENV !== 'production',
    })
    this.port = options.port || parseInt(process.env.PORT || '4000')
    this.endpoint = options.endpoint || '/graphql'
    this.hostname = options.hostname || '0.0.0.0'

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

    if (options.https) {
      this._server =
        typeof options.https === 'object'
          ? createHttpsServer(options.https, this.requestListener.bind(this))
          : createHttpsServer(this.requestListener.bind(this))
    } else {
      this._server = createServer(this.requestListener.bind(this))
    }
  }

  async handleIncomingMessage(
    ...args: Parameters<typeof getNodeRequest>
  ): Promise<Response> {
    this.logger.debug('Node Request received', ...args)
    const request = await getNodeRequest(...args)
    const response = await this.handleRequest(request)
    return response
  }

  async requestListener(req: IncomingMessage, res: ServerResponse) {
    const response = await this.handleIncomingMessage(req)
    await sendNodeResponse(response, res)
  }

  get server() {
    return this._server
  }

  start(
    callback: VoidFunction = () => {
      this.logger.info(
        `GraphQL server running at http://${this.hostname}:${this.port}${this.endpoint}.`,
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
    const response = await LightMyRequest.inject(
      this.requestListener.bind(this) as any,
      {
        method: 'POST',
        url: this.endpoint,
        headers,
        payload: JSON.stringify({
          query: typeof document === 'string' ? document : print(document),
          variables,
          operationName,
        }),
      },
    )
    return {
      response,
      get executionResult() {
        return JSON.parse(response.payload)
      },
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
export { GraphQLBlob } from '@graphql-yoga/core'
