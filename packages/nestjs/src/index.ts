import type {
  Express,
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { printSchema } from 'graphql'
import { createYoga, YogaServerInstance, YogaServerOptions } from 'graphql-yoga'
import type { ExecutionParams } from 'subscriptions-transport-ws'
import { Injectable, Logger } from '@nestjs/common'
import {
  AbstractGraphQLDriver,
  GqlModuleOptions,
  GqlSubscriptionService,
  SubscriptionConfig,
} from '@nestjs/graphql'

export type YogaDriverPlatform = 'express' | 'fastify'

export type YogaDriverServerContext<Platform extends YogaDriverPlatform> =
  Platform extends 'fastify'
    ? {
        req: FastifyRequest
        reply: FastifyReply
      }
    : {
        req: ExpressRequest
        res: ExpressResponse
      }

export type YogaDriverServerOptions<Platform extends YogaDriverPlatform> = Omit<
  YogaServerOptions<YogaDriverServerContext<Platform>, never>,
  'context' | 'schema'
>

export type YogaDriverServerInstance<Platform extends YogaDriverPlatform> =
  YogaServerInstance<YogaDriverServerContext<Platform>, never>

export type YogaDriverConfig<Platform extends YogaDriverPlatform = 'express'> =
  GqlModuleOptions &
    YogaDriverServerOptions<Platform> & {
      /**
       * Subscriptions configuration. Passing `true` will install only `graphql-ws`.
       */
      subscriptions?: boolean | YogaDriverSubscriptionConfig
    }

export type YogaDriverSubscriptionConfig = {
  'graphql-ws'?: Omit<SubscriptionConfig['graphql-ws'], 'onSubscribe'>
  'subscriptions-transport-ws'?: Omit<
    SubscriptionConfig['subscriptions-transport-ws'],
    'onOperation'
  >
}

export abstract class AbstractYogaDriver<
  Platform extends YogaDriverPlatform,
> extends AbstractGraphQLDriver<YogaDriverConfig<Platform>> {
  protected yoga!: YogaDriverServerInstance<Platform>

  public async start(options: YogaDriverConfig<Platform>) {
    const platformName = this.httpAdapterHost.httpAdapter.getType() as Platform
    options = {
      ...options,
      // disable error masking by default
      maskedErrors: options.maskedErrors == null ? false : options.maskedErrors,
      // disable graphiql in production
      graphiql:
        options.graphiql == null
          ? process.env.NODE_ENV !== 'production'
          : options.graphiql,
    }
    if (platformName === 'express') {
      return this.registerExpress(options as YogaDriverConfig<'express'>)
    }
    if (platformName === 'fastify') {
      return this.registerFastify(options as YogaDriverConfig<'fastify'>)
    }
    throw new Error(`Provided HttpAdapter "${platformName}" not supported`)
  }

  public async stop() {
    // noop
  }

  protected registerExpress(
    options: YogaDriverConfig<'express'>,
    { preStartHook }: { preStartHook?: (app: Express) => void } = {},
  ) {
    const app: Express = this.httpAdapterHost.httpAdapter.getInstance()

    preStartHook?.(app)

    // nest's logger doesnt have the info method
    class LoggerWithInfo extends Logger {
      constructor(context: string) {
        super(context)
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      info(message: any, ...args: any[]) {
        this.log(message, ...args)
      }
    }

    const yoga = createYoga<YogaDriverServerContext<'express'>>({
      ...options,
      graphqlEndpoint: options.path,
      // disable logging by default
      // however, if `true` use nest logger
      logging:
        options.logging == null
          ? false
          : options.logging
          ? new LoggerWithInfo('YogaDriver')
          : options.logging,
    })

    this.yoga = yoga as YogaDriverServerInstance<Platform>

    app.use(yoga.graphqlEndpoint, (req, res) => yoga(req, res, { req, res }))
  }

  protected registerFastify(
    options: YogaDriverConfig<'fastify'>,
    { preStartHook }: { preStartHook?: (app: FastifyInstance) => void } = {},
  ) {
    const app: FastifyInstance = this.httpAdapterHost.httpAdapter.getInstance()

    preStartHook?.(app)

    const yoga = createYoga<YogaDriverServerContext<'fastify'>>({
      ...options,
      graphqlEndpoint: options.path,
      // disable logging by default
      // however, if `true` use fastify logger
      logging:
        options.logging == null
          ? false
          : options.logging
          ? app.log
          : options.logging,
    })

    this.yoga = yoga as YogaDriverServerInstance<Platform>

    app.all(yoga.graphqlEndpoint, async (req, reply) => {
      const response = await yoga.handleNodeRequest(req, {
        req,
        reply,
      })
      response.headers.forEach((value, key) => reply.header(key, value))
      reply.status(response.status)
      reply.send(response.body)
      return reply
    })
  }
}

@Injectable()
export class YogaDriver<
  Platform extends YogaDriverPlatform = 'express',
> extends AbstractYogaDriver<Platform> {
  private subscriptionService?: GqlSubscriptionService

  public async start(options: YogaDriverConfig<Platform>) {
    const opts = await this.graphQlFactory.mergeWithSchema<
      YogaDriverConfig<Platform>
    >(options)

    if (opts.definitions?.path) {
      if (!opts.schema) {
        throw new Error('Schema is required when generating definitions')
      }
      await this.graphQlFactory.generateDefinitions(
        printSchema(opts.schema),
        opts,
      )
    }

    await super.start(opts)

    if (opts.subscriptions) {
      if (!opts.schema) {
        throw new Error('Schema is required when using subscriptions')
      }

      const config: SubscriptionConfig =
        opts.subscriptions === true
          ? {
              'graphql-ws': true,
            }
          : opts.subscriptions

      if (config['graphql-ws']) {
        config['graphql-ws'] =
          typeof config['graphql-ws'] === 'object' ? config['graphql-ws'] : {}

        config['graphql-ws'].onSubscribe = async (ctx, msg) => {
          const {
            schema,
            execute,
            subscribe,
            contextFactory,
            parse,
            validate,
          } = this.yoga.getEnveloped({
            ...ctx,
            // @ts-expect-error context extra is from graphql-ws/lib/use/ws
            req: ctx.extra.request,
            // @ts-expect-error context extra is from graphql-ws/lib/use/ws
            socket: ctx.extra.socket,
            params: msg.payload,
          })

          const args = {
            schema,
            operationName: msg.payload.operationName,
            document: parse(msg.payload.query),
            variableValues: msg.payload.variables,
            contextValue: await contextFactory({ execute, subscribe }),
          }

          const errors = validate(args.schema, args.document)
          if (errors.length) return errors
          return args
        }
      }

      if (config['subscriptions-transport-ws']) {
        config['subscriptions-transport-ws'] =
          typeof config['subscriptions-transport-ws'] === 'object'
            ? config['subscriptions-transport-ws']
            : {}

        config['subscriptions-transport-ws'].onOperation = async (
          _msg: unknown,
          params: ExecutionParams,
          ws: WebSocket,
        ) => {
          const {
            schema,
            execute,
            subscribe,
            contextFactory,
            parse,
            validate,
          } = this.yoga.getEnveloped({
            ...params.context,
            req:
              // @ts-expect-error upgradeReq does exist but is untyped
              ws.upgradeReq,
            socket: ws,
            params,
          })

          const args = {
            schema,
            operationName: params.operationName,
            document:
              typeof params.query === 'string'
                ? parse(params.query)
                : params.query,
            variables: params.variables,
            context: await contextFactory({ execute, subscribe }),
          }

          const errors = validate(args.schema, args.document)
          if (errors.length) return errors
          return args
        }
      }

      this.subscriptionService = new GqlSubscriptionService(
        {
          schema: opts.schema,
          path: opts.path,
          execute: (...args) => {
            const contextValue =
              args[0].contextValue ||
              // @ts-expect-error args can be inlined with graphql-js@<=15
              args[3]
            if (!contextValue) {
              throw new Error(
                'Execution arguments are missing the context value',
              )
            }
            return (
              contextValue
                // @ts-expect-error execute method will be available, see above
                .execute(...args)
            )
          },
          subscribe: (...args) => {
            const contextValue =
              args[0].contextValue ||
              // @ts-expect-error args can be inlined with graphql-js@<=15
              args?.[3]
            if (!contextValue) {
              throw new Error(
                'Subscribe arguments are missing the context value',
              )
            }
            return (
              contextValue
                // @ts-expect-error execute method will be available, see above
                .subscribe(...args)
            )
          },
          ...config,
        },
        this.httpAdapterHost.httpAdapter.getHttpServer(),
      )
    }
  }

  public async stop() {
    await this.subscriptionService?.stop()
  }
}
