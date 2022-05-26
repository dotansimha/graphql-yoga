import { AbstractGraphQLDriver } from '@nestjs/graphql'
import type { FastifyRequest, FastifyReply } from 'fastify'

import { YogaDriverConfig } from '../interfaces'
import { createServer, YogaNodeServerInstance } from '@graphql-yoga/node'
import { useApolloServerErrors } from '@envelop/apollo-server-errors'
import { Logger } from '@nestjs/common'
import { createAsyncIterator } from '../utils/async-iterator.util'

export abstract class YogaBaseDriver<
  T extends YogaDriverConfig = YogaDriverConfig,
> extends AbstractGraphQLDriver<T> {
  protected yogaInstance: YogaNodeServerInstance<{}, {}, {}>

  public async start(options: T) {
    const httpAdapter = this.httpAdapterHost.httpAdapter
    const platformName = httpAdapter.getType()

    const opts = {
      ...options,
      plugins: [...(options.plugins || []), useApolloServerErrors()],
      // disable error masking by default
      maskedErrors: options.maskedErrors ? true : false,
      // disable graphiql in production
      graphiql:
        (options.graphiql === undefined &&
          process.env.NODE_ENV === 'production') ||
        options.graphiql === false
          ? false
          : options.graphiql,
    }

    if (platformName === 'express') {
      await this.registerExpress(opts)
    } else if (platformName === 'fastify') {
      await this.registerFastify(opts)
    } else {
      throw new Error(`No support for current HttpAdapter: ${platformName}`)
    }
  }

  /* eslit-disable-next-line @typescript-eslint/no-empty-function */
  public async stop(): Promise<void> {}

  protected async registerExpress(
    options: T,
    { preStartHook }: { preStartHook?: () => void } = {},
  ) {
    const httpAdapter = this.httpAdapterHost.httpAdapter
    const app = httpAdapter.getInstance()

    preStartHook?.()

    const graphQLServer = createServer({
      ...options,
      // disable logging by default, if set to `true`, pass a nestjs Logger or pass custom logger
      logging: !options.logging
        ? false
        : typeof options.logging === 'boolean'
        ? new Logger('YogaDriver')
        : options.logging,
    })

    this.yogaInstance = graphQLServer

    app.use(options.path, graphQLServer)
  }

  protected async registerFastify(
    options: T,
    { preStartHook }: { preStartHook?: () => void } = {},
  ) {
    const httpAdapter = this.httpAdapterHost.httpAdapter
    const app = httpAdapter.getInstance()

    preStartHook?.()

    const graphQLServer = createServer<{
      req: FastifyRequest
      reply: FastifyReply
    }>({
      ...options,
      logging: !options.logging
        ? false
        : typeof options.logging === 'boolean'
        ? app.log
        : options.logging,
    })

    this.yogaInstance = graphQLServer

    app.route({
      url: options.path,
      method: ['GET', 'POST', 'OPTIONS'],
      handler: async (req, reply) => {
        const response = await graphQLServer.handleIncomingMessage(req, {
          req,
          reply,
        })
        response.headers.forEach((value, key) => {
          reply.header(key, value)
        })

        reply.status(response.status)

        reply.send(response.body)
      },
    })
  }

  public subscriptionWithFilter(
    instanceRef: unknown,
    filterFn: (
      payload: any,
      variables: any,
      context: any,
    ) => boolean | Promise<boolean>,
    createSubscribeContext: Function,
  ) {
    return <TPayload, TVariables, TContext, TInfo>(
      ...args: [TPayload, TVariables, TContext, TInfo]
    ): any =>
      createAsyncIterator(createSubscribeContext()(...args), (payload: any) =>
        filterFn.call(instanceRef, payload, ...args.slice(1)),
      )
  }
}
