import {
  createServer as createHttpServer,
  IncomingMessage,
  Server as NodeServer,
  ServerResponse,
} from 'http'
import { createServer as createHttpsServer } from 'https'
import pino from 'pino'
import { getNodeRequest, NodeRequest, sendNodeResponse } from './http-utils'
import { YogaServer, YogaServerOptions } from '@graphql-yoga/common'
import type { YogaNodeServerOptions, AddressInfo } from './types'
import 'pino-pretty'
import { platform } from 'os'

function getPinoLogger<TContext, TRootValue>(
  options: YogaNodeServerOptions<TContext, TRootValue>['logging'] = {},
): YogaServerOptions<TContext, TRootValue>['logging'] {
  if (options === false) {
    return false
  }
  const optionsIsAnObject = typeof options === 'object'
  if (optionsIsAnObject && 'debug' in options) {
    return options
  }
  const prettyLog =
    optionsIsAnObject && 'prettyLog' in options
      ? options?.prettyLog
      : process.env.NODE_ENV === 'development'

  const logLevel =
    (optionsIsAnObject && 'logLevel' in options && options.logLevel) ||
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
  TAdditionalContext extends Record<string, any>,
  TRootValue,
> extends YogaServer<TAdditionalContext, TRootValue> {
  /**
   * Address Information for Server
   */
  private addressInfo: AddressInfo
  private nodeServer: NodeServer | null = null

  constructor(
    private options?: YogaNodeServerOptions<TAdditionalContext, TRootValue>,
  ) {
    super({
      ...options,
      logging: getPinoLogger(options?.logging),
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

  getNodeServer(): NodeServer {
    if (!this.nodeServer) {
      if (this.options?.https) {
        this.nodeServer =
          typeof this.options?.https === 'object'
            ? createHttpsServer(this.options.https, this.requestListener)
            : createHttpsServer(this.requestListener)
      } else {
        this.nodeServer = createHttpServer(this.requestListener)
      }
    }
    return this.nodeServer
  }

  getAddressInfo(): AddressInfo {
    return this.addressInfo
  }

  getServerUrl(): string {
    return `${this.addressInfo.protocol}://${this.addressInfo.hostname}:${this.addressInfo.port}${this.addressInfo.endpoint}`
  }

  async handleIncomingMessage(
    nodeRequest: NodeRequest,
    additionalContext?: TAdditionalContext,
  ): Promise<Response> {
    this.logger.debug(`Node Request received`)
    const request = await getNodeRequest(nodeRequest, this.addressInfo)
    this.logger.debug('Node Request processed')
    const response = await this.handleRequest(request, additionalContext)
    this.logger.debug('Response returned')
    return response
  }

  requestListener = async (req: IncomingMessage, res: ServerResponse) => {
    const response = await this.handleIncomingMessage(req, { req, res } as any)
    sendNodeResponse(response, res)
  }

  start() {
    const nodeServer = this.getNodeServer()
    return new Promise<void>((resolve, reject) => {
      try {
        nodeServer.listen(
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
    const nodeServer = this.getNodeServer()
    this.logger.info('Shutting down GraphQL Server.')
    return new Promise<void>((resolve, reject) => {
      nodeServer.close((err) => {
        if (err != null) {
          this.logger.error(
            'Something went wrong while trying to shutdown the server.',
            err,
          )
          reject(err)
        } else {
          this.logger.info(`GraphQL Server stopped successfully`)
          resolve()
        }
      })
    })
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
export function createServer<
  TAdditionalContext extends Record<string, any> = {
    req: IncomingMessage
    res: ServerResponse
  },
  TRootValue = {},
>(options?: YogaNodeServerOptions<TAdditionalContext, TRootValue>) {
  return new YogaNodeServer<TAdditionalContext, TRootValue>(options)
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
