import {
  createServer as createHttpServer,
  IncomingMessage,
  RequestListener,
  Server as NodeServer,
  ServerResponse,
} from 'http'
import { createServer as createHttpsServer } from 'https'
import { getNodeRequest, NodeRequest, sendNodeResponse } from './http-utils'
import { YogaServer } from '@graphql-yoga/common'
import type { YogaNodeServerOptions, AddressInfo } from './types'
import { platform } from 'os'

class YogaNodeServer<
  TServerContext extends Record<string, any>,
  TUserContext extends Record<string, any>,
  TRootValue,
> extends YogaServer<TServerContext, TUserContext, TRootValue> {
  /**
   * Address Information for Server
   */
  private addressInfo: AddressInfo
  private nodeServer: NodeServer | null = null

  constructor(
    private options?: YogaNodeServerOptions<
      TServerContext,
      TUserContext,
      TRootValue
    >,
  ) {
    super({
      ...options,
      graphiql: function nodeGraphiQLFactory(request, ...args) {
        if (typeof options?.graphiql === 'function') {
          let returnedOptions = options.graphiql(request, ...args)
          if (returnedOptions === false) {
            return false
          } else if (returnedOptions === true) {
            returnedOptions = {}
          }
          return {
            endpoint: options?.endpoint,
            ...returnedOptions,
          }
        } else if (typeof options?.graphiql === 'object') {
          return {
            endpoint: options?.endpoint,
            ...options.graphiql,
          }
        } else if (options?.graphiql === false) {
          return false
        }
        return {
          endpoint: options?.endpoint,
        }
      },
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
  }

  getNodeServer(): NodeServer {
    if (!this.nodeServer) {
      this.endpoint = this.endpoint || '/graphql'
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
    serverContext: TServerContext,
  ): Promise<Response> {
    this.logger.debug(`Node Request received`)
    const request = getNodeRequest(nodeRequest, this.addressInfo)
    this.logger.debug('Node Request processed')
    const response = await this.handleRequest(request, serverContext)
    return response
  }

  requestListener = async (req: IncomingMessage, res: ServerResponse) => {
    const response = await this.handleIncomingMessage(req, { req, res } as any)
    this.logger.debug('Sending response to Node Server')
    return sendNodeResponse(response, res)
  }

  handle = this.requestListener

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
  TServerContext extends Record<string, any> = {
    req: IncomingMessage
    res: ServerResponse
  },
  TUserContext extends Record<string, any> = {},
  TRootValue = {},
>(
  options?: YogaNodeServerOptions<TServerContext, TUserContext, TRootValue>,
): YogaNodeServerInstance<TServerContext, TUserContext, TRootValue> {
  const server = new YogaNodeServer(options)
  return new Proxy(server.requestListener as any, {
    get: (_, prop) => {
      if (server[prop]) {
        if (server[prop].bind) {
          return server[prop].bind(server)
        }
        return server[prop]
      } else if (server.requestListener[prop]) {
        if (server.requestListener[prop].bind) {
          return server.requestListener[prop].bind(server.requestListener)
        }
        return server.requestListener[prop]
      }
    },
    apply: (_, __, [req, res]: Parameters<RequestListener>) =>
      server.requestListener(req, res),
  })
}

export type YogaNodeServerInstance<TServerContext, TUserContext, TRootValue> =
  YogaNodeServer<TServerContext, TUserContext, TRootValue> &
    YogaNodeServer<TServerContext, TUserContext, TRootValue>['requestListener']

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
