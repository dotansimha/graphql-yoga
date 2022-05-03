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
import { platform, release } from 'os'
import { create } from 'cross-undici-fetch'

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
      fetchAPI:
        options?.fetchAPI ??
        create({
          useNodeFetch: true,
          formDataLimits: options?.multipartLimits,
        }),
    })
    this.addressInfo = {
      // Windows doesn't support 0.0.0.0 binding
      // We need to use 127.0.0.1 for Windows and WSL
      hostname:
        options?.hostname ||
        // Is Windows?
        (platform() === 'win32' ||
        // is WSL?
        release().toLowerCase().includes('microsoft')
          ? '127.0.0.1'
          : '0.0.0.0'),
      port: options?.port ?? parseInt(process.env.PORT || '4000'),
      endpoint: options?.endpoint || '/graphql',
      protocol: options?.https ? 'https' : 'http',
    }

    this.logger.debug('Setting up server.')
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
    this.logger.debug(`Processing Node Request`)
    const request = getNodeRequest(
      nodeRequest,
      this.addressInfo,
      this.fetchAPI.Request,
    )
    const response = await this.handleRequest(request, serverContext)
    return response
  }

  requestListener = async (req: IncomingMessage, res: ServerResponse) => {
    const response = await this.handleIncomingMessage(req, { req, res } as any)
    this.logger.debug('Passing Response back to Node')
    return sendNodeResponse(response, res)
  }

  handle = this.requestListener

  /**
   * @deprecated Will be removed in the next major. Get the server from `.start()` instead
   */
  getNodeServer(): NodeServer {
    this.logger.warn(
      `getNodeServer() is deprecated. You should get the server instance from ".start()" method instead`,
    )
    return this.getOrCreateNodeServer()
  }

  // Will be moved to `start` method once `getNodeServer` method is removed completely
  private getOrCreateNodeServer(): NodeServer {
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

  start() {
    return new Promise<NodeServer>((resolve, reject) => {
      try {
        this.getOrCreateNodeServer().listen(
          this.addressInfo.port,
          this.addressInfo.hostname,
          () => {
            const serverUrl = this.getServerUrl()
            this.logger.info(`Running GraphQL Server at ${serverUrl}`)
            resolve(this.nodeServer!)
          },
        )
      } catch (e: any) {
        this.logger.error(`GraphQL Server couldn't start`, e)
        reject(e)
      }
    })
  }

  stop() {
    this.logger.info('Shutting down GraphQL Server')
    return new Promise<void>((resolve, reject) => {
      if (this.nodeServer == null) {
        reject(new Error('GraphQL Server is not running'))
        return
      }
      this.nodeServer.close((err) => {
        if (err != null) {
          this.logger.error(
            'Something went wrong while trying to shutdown the server',
            err,
          )
          reject(err)
        } else {
          this.logger.info(`Stopped GraphQL Server successfully`)
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
