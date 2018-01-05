import { graphqlExpress } from 'apollo-server-express'
import { apolloUploadExpress, GraphQLUpload } from 'apollo-upload-server'
import * as bodyParser from 'body-parser-graphql'
import * as cors from 'cors'
import * as express from 'express'
import { PathParams, RequestHandler, RequestHandlerParams } from 'express-serve-static-core'
import * as fs from 'fs'
import { execute, GraphQLSchema, subscribe } from 'graphql'
import { importSchema } from 'graphql-import'
import expressPlayground from 'graphql-playground-middleware-express'
import { makeExecutableSchema } from 'graphql-tools'
import { createServer } from 'http'
import * as path from 'path'
import { SubscriptionServer } from 'subscriptions-transport-ws'

import { Options, Props } from './types'

export { PubSub, withFilter } from 'graphql-subscriptions'
export { Options }
export { GraphQLServerLambda } from './lambda'

export class GraphQLServer {
  express: express.Application
  subscriptionServer: SubscriptionServer | null
  options: Options = {
    tracing: { mode: 'http-header' },
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 4000,
    endpoint: '/',
    subscriptions: '/',
    playground: '/',
  }
  executableSchema: GraphQLSchema
  context: any

  private middlewares: {
    [key: string]: { path?: PathParams; handlers: RequestHandler[] | RequestHandlerParams[] }[],
  } = { use: [], get: [], post: [] }

  constructor(props: Props) {
    this.express = express()

    this.subscriptionServer = null
    this.context = props.context

    if (props.schema) {
      this.executableSchema = props.schema
    } else if (props.typeDefs && props.resolvers) {
      let { typeDefs, resolvers } = props

      // read from .graphql file if path provided
      if (typeDefs.endsWith('graphql')) {
        const schemaPath = path.isAbsolute(typeDefs) ? path.resolve(typeDefs) : path.resolve(typeDefs)

        if (!fs.existsSync(schemaPath)) {
          throw new Error(`No schema found for path: ${schemaPath}`)
        }

        typeDefs = importSchema(schemaPath)
      }

      const uploadMixin = typeDefs.includes('scalar Upload') ? { Upload: GraphQLUpload } : {}
      this.executableSchema = makeExecutableSchema({
        typeDefs,
        resolvers: {
          ...uploadMixin,
          ...resolvers,
        },
      })
    }
  }

  use(...handlers: RequestHandlerParams[]): this
  use(path: PathParams, ...handlers: RequestHandlerParams[]): this
  use(path?, ...handlers): this {
    this.middlewares.use.push({ path, handlers })
    return this
  }

  get(path: PathParams, ...handlers: RequestHandlerParams[]): this {
    this.middlewares.get.push({ path, handlers })
    return this
  }

  post(path: PathParams, ...handlers: RequestHandlerParams[]): this {
    this.middlewares.post.push({ path, handlers })
    return this
  }

  start(options?: Options, callback: ((options: Options) => void) = () => null): Promise<void> {
    const app = this.express

    this.options = { ...this.options, ...options }

    const tracing = (req: express.Request) => {
      const t = this.options.tracing
      if (typeof t === 'boolean') {
        return t
      } else if (t.mode === 'http-header') {
        return req.get('x-apollo-tracing') !== undefined
      } else {
        return t.mode === 'enabled'
      }
    }

    // CORS support
    if (this.options.cors) {
      app.use(cors(this.options.cors))
    } else if (this.options.cors !== false) {
      app.use(cors())
    }

    app.post(this.options.endpoint, bodyParser.graphql(), apolloUploadExpress(this.options.uploads))

    if (this.options.uploads) {
      app.post(this.options.endpoint, apolloUploadExpress(this.options.uploads))
    }

    while (this.middlewares.use.length > 0) {
      const middleware = this.middlewares.use.shift()
      if (middleware.path) {
        app.use(middleware.path, ...middleware.handlers)
      } else {
        app.use(...middleware.handlers)
      }
    }

    while (this.middlewares.get.length > 0) {
      const middleware = this.middlewares.get.shift()
      if (middleware.path) {
        app.get(middleware.path, ...middleware.handlers)
      }
    }

    while (this.middlewares.post.length > 0) {
      const middleware = this.middlewares.post.shift()
      if (middleware.path) {
        app.post(middleware.path, ...middleware.handlers)
      }
    }

    app.post(
      this.options.endpoint,
      graphqlExpress(async request => {
        let context
        try {
          context = typeof this.context === 'function' ? await this.context({ request }) : this.context
        } catch (e) {
          console.error(e)
          throw e
        }

        return {
          schema: this.executableSchema,
          tracing: tracing(request),
          cacheControl: this.options.cacheControl,
          formatError: this.options.formatError,
          logFunction: this.options.logFunction,
          rootValue: this.options.rootValue,
          validationRules: this.options.validationRules,
          fieldResolver: this.options.fieldResolver,
          formatParams: this.options.formatParams,
          formatResponse: this.options.formatResponse,
          debug: this.options.debug,
          context,
        }
      }),
    )

    if (this.options.playground) {
      const isDev = process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'development'
      const playgroundOptions = isDev
        ? { useGraphQLConfig: true, env: process.env }
        : this.options.subscriptions
          ? { endpoint: this.options.endpoint, subscriptionsEndpoint: this.options.subscriptions }
          : { endpoint: this.options.endpoint }

      app.get(this.options.playground, expressPlayground(playgroundOptions))
    }

    if (!this.executableSchema) {
      throw new Error('No schema defined')
    }

    return new Promise((resolve, reject) => {
      if (!this.options.subscriptions) {
        app.listen(this.options.port, () => {
          callback(this.options)
          resolve()
        })
      } else {
        const combinedServer = createServer(app)

        combinedServer.listen(this.options.port, () => {
          callback(this.options)
          resolve()
        })

        this.subscriptionServer = SubscriptionServer.create(
          {
            schema: this.executableSchema,
            execute,
            subscribe,
            onOperation: async (message, connection, webSocket) => {
              let context
              try {
                context =
                  typeof this.context === 'function' ? await this.context({ connection }) : this.context
              } catch (e) {
                console.error(e)
                throw e
              }
              return { ...connection, context }
            },
          },
          {
            server: combinedServer,
            path: this.options.subscriptions,
          },
        )
      }
    })
  }
}
