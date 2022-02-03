import {
  createServer as createHttpServer,
  IncomingMessage,
  Server as NodeServer,
  ServerResponse,
} from 'http'
import { createServer as createHttpsServer } from 'https'
import pino from 'pino'
import { getNodeRequest, NodeRequest, sendNodeResponse } from './http-utils'
import {
  YogaServer,
  YogaLogger,
  YogaInitialContext,
  GraphQLYogaError,
} from '@graphql-yoga/common'
import type {
  GraphQLServerInject,
  YogaNodeServerOptions,
  AddressInfo,
} from './types'
import LightMyRequest from 'light-my-request'
import { ExecutionResult, print } from 'graphql'
import { platform } from 'os'

function getPinoLogger<TContext, TRootValue>(
  options: YogaNodeServerOptions<TContext, TRootValue>['logging'] = {},
): YogaLogger {
  const prettyLog =
    typeof options === 'object' && 'prettyLog' in options
      ? options?.prettyLog
      : process.env.NODE_ENV === 'development'

  const logLevel =
    (typeof options === 'object' &&
      'logLevel' in options &&
      options.logLevel) ||
    (process.env.NODE_ENV === 'development' ? 'debug' : 'info')

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

class YogaNodeServer<
  TContext extends YogaInitialContext,
  TRootValue,
> extends YogaServer<TContext, TRootValue> {
  /**
   * Address Information for Server
   */
  private addressInfo: AddressInfo
  private nodeServer: NodeServer | null = null

  constructor(private options?: YogaNodeServerOptions<TContext, TRootValue>) {
    super({
      ...options,
      logging:
        typeof options?.logging === 'object' && 'debug' in options?.logging
          ? options?.logging
          : getPinoLogger(options?.logging),
    })
    this.addressInfo = {
      // Windows doesn't support 0.0.0.0 binding
      hostname:
        options?.hostname || (platform() === 'win32' ? '127.0.0.1' : '0.0.0.0'),
      port: options?.port ?? parseInt(process.env.PORT || '4000'),
      endpoint: options?.endpoint || '/graphql',
      protocol: options?.https ? 'https' : 'http',
    }

    this.logger.debug('Setting up server.')

    if (this.graphiql) {
      this.graphiql.endpoint =
        this.graphiql.endpoint || this.addressInfo.endpoint
    }
  }

  getNodeServer(): NodeServer | null {
    return this.nodeServer
  }

  getAddressInfo(): AddressInfo {
    return this.addressInfo
  }

  getServerUrl(): string {
    return `${this.addressInfo.protocol}://${this.addressInfo.hostname}:${this.addressInfo.port}${this.addressInfo.endpoint}`
  }

  async handleIncomingMessage(nodeRequest: NodeRequest): Promise<Response> {
    this.logger.debug(`Node Request received`)
    const request = await getNodeRequest(nodeRequest, this.addressInfo)
    this.logger.debug('Node Request processed')
    const response = await this.handleRequest(request)
    this.logger.debug('Response returned')
    return response
  }

  requestListener = async (req: IncomingMessage, res: ServerResponse) => {
    const response = await this.handleIncomingMessage(req)
    await sendNodeResponse(response, res)
  }

  start() {
    return new Promise<void>((resolve, reject) => {
      try {
        if (this.options?.https) {
          this.nodeServer =
            typeof this.options?.https === 'object'
              ? createHttpsServer(this.options.https, this.requestListener)
              : createHttpsServer(this.requestListener)
        } else {
          this.nodeServer = createHttpServer(this.requestListener)
        }

        this.nodeServer.listen(
          this.addressInfo.port,
          this.addressInfo.hostname,
          () => {
            const serverUrl = this.getServerUrl()
            this.logger.info(`GraphQL Server running at ${serverUrl}.`)
            resolve()
          },
        )
      } catch (e: any) {
        this.logger.error(`GraphQL Server couldn't start`, e)
        reject(e)
      }
    })
  }

  stop() {
    this.logger.info('Shutting down GraphQL Server.')
    return new Promise<void>((resolve, reject) => {
      if (!this.nodeServer) {
        reject(new GraphQLYogaError('Server not running.'))
        return
      }
      this.nodeServer.close((err) => {
        if (err != null) {
          this.logger.error(
            'Something went wrong while trying to shutdown the server.',
            err,
          )
          reject(err)
        } else {
          this.nodeServer = null
          this.logger.info(`GraphQL Server stopped successfully`)
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
      url: this.addressInfo.endpoint,
      headers,
      payload: JSON.stringify({
        query:
          document &&
          (typeof document === 'string' ? document : print(document)),
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
export function createServer<TContext extends YogaInitialContext, TRootValue>(
  options?: YogaNodeServerOptions<TContext, TRootValue>,
) {
  return new YogaNodeServer<TContext, TRootValue>(options)
}

export {
  ExecutionPatchResult,
  YogaInitialContext,
  CORSOptions,
  YogaLogger,
  GraphQLYogaError,
  shouldRenderGraphiQL,
  renderGraphiQL,
  GraphiQLOptions,
} from '@graphql-yoga/common'

export * from '@envelop/core'
export * from '@graphql-yoga/subscription'
