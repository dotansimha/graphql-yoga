import { graphqlExpress } from 'apollo-server-express'
import { apolloUploadExpress, GraphQLUpload } from 'apollo-upload-server'
import * as bodyParser from 'body-parser-graphql'
import * as cors from 'cors'
import * as express from 'express'
import {
  PathParams,
  RequestHandler,
  RequestHandlerParams,
} from 'express-serve-static-core'
import * as fs from 'fs'
import { execute, GraphQLSchema, subscribe, DocumentNode, print } from 'graphql'
import { importSchema } from 'graphql-import'
import expressPlayground from 'graphql-playground-middleware-express'
import { makeExecutableSchema } from 'graphql-tools'
import { createServer, Server } from 'http'
import { createServer as createHttpsServer, Server as HttpsServer} from 'https';
import * as path from 'path'
import { SubscriptionServer } from 'subscriptions-transport-ws'

import { SubscriptionServerOptions, Options, Props } from './types'
import { ITypeDefinitions } from 'graphql-tools/dist/Interfaces'
import { defaultErrorFormatter } from './defaultErrorFormatter'

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
    [key: string]: {
      path?: PathParams
      handlers: RequestHandler[] | RequestHandlerParams[]
    }[]
  } = { use: [], get: [], post: [] }

  constructor(props: Props) {
    this.express = express()

    this.subscriptionServer = null
    this.context = props.context

    if (props.schema) {
      this.executableSchema = props.schema
    } else if (props.typeDefs && props.resolvers) {
      const { directiveResolvers, resolvers, typeDefs } = props

      const typeDefsString = buildTypeDefsString(typeDefs)

      const uploadMixin = typeDefsString.includes('scalar Upload')
        ? { Upload: GraphQLUpload }
        : {}

      this.executableSchema = makeExecutableSchema({
        directiveResolvers,
        typeDefs: typeDefsString,
        resolvers: {
          ...uploadMixin,
          ...resolvers,
        },
      })
    }
  }

  // use, get and post mimic the methods on express.Application
  // because middleware cannot be inserted, they are stored here
  // in start(), they are added in the right place in the middleware stack
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

  start(
    options: Options,
    callback?: ((options: Options) => void),
  ): Promise<Server|HttpsServer>
  start(callback?: ((options: Options) => void)): Promise<Server|HttpsServer>
  start(
    optionsOrCallback?: Options | ((options: Options) => void),
    callback?: ((options: Options) => void),
  ): Promise<Server|HttpsServer> {
    const options =
      optionsOrCallback && typeof optionsOrCallback === 'function'
        ? {}
        : optionsOrCallback
    const callbackFunc = callback
      ? callback
      : optionsOrCallback && typeof optionsOrCallback === 'function'
        ? optionsOrCallback
        : () => null

    const app = this.express

    this.options = { ...this.options, ...options }

    let subscriptionServerOptions: SubscriptionServerOptions | null = null
    if (this.options.subscriptions) {
      subscriptionServerOptions =
        typeof this.options.subscriptions === 'string'
          ? { path: this.options.subscriptions }
          : { path: '/', ...this.options.subscriptions }
    }

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

    app.post(this.options.endpoint, bodyParser.graphql())

    if (this.options.uploads) {
      app.post(this.options.endpoint, apolloUploadExpress(this.options.uploads))
    } else if (this.options.uploads !== false) {
      app.post(this.options.endpoint, apolloUploadExpress())
    }

    // All middlewares added before start() was called are applied to
    // the express application here, in the order they were provided
    // (following Queue pattern)
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
          context =
            typeof this.context === 'function'
              ? await this.context({ request })
              : this.context
        } catch (e) {
          console.error(e)
          throw e
        }

        return {
          schema: this.executableSchema,
          tracing: tracing(request),
          cacheControl: this.options.cacheControl,
          formatError: this.options.formatError || defaultErrorFormatter,
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
      const playgroundOptions = subscriptionServerOptions
        ? {
            endpoint: this.options.endpoint,
            subscriptionsEndpoint: subscriptionServerOptions.path,
          }
        : { endpoint: this.options.endpoint }

      app.get(this.options.playground, expressPlayground(playgroundOptions))
    }

    if (!this.executableSchema) {
      throw new Error('No schema defined')
    }

    return new Promise((resolve, reject) => {
      const server: Server|HttpsServer = this.options.https ? 
        createHttpsServer(this.options.https, app) : createServer(app);

      if (!subscriptionServerOptions) {
        server.listen(this.options.port, () => {
          callbackFunc(this.options)
          resolve(server)
        })
      } else {
        const combinedServer = server;
        combinedServer.listen(this.options.port, () => {
          callbackFunc(this.options)
          resolve(combinedServer)
        })

        this.subscriptionServer = SubscriptionServer.create(
          {
            schema: this.executableSchema,
            execute,
            subscribe,
            onConnect: subscriptionServerOptions.onConnect
              ? subscriptionServerOptions.onConnect
              : async (connectionParams, webSocket) => ({ ...connectionParams }),
            onDisconnect: subscriptionServerOptions.onDisconnect,
            onOperation: async (message, connection, webSocket) => {
              // The following should be replaced when SubscriptionServer accepts a formatError
              // parameter for custom error formatting.
              // See https://github.com/apollographql/subscriptions-transport-ws/issues/182
              connection.formatResponse = value => ({
                  ...value,
                  errors: value.errors && value.errors.map(this.options.formatError || defaultErrorFormatter),
              })

              let context
              try {
                context =
                  typeof this.context === 'function'
                    ? await this.context({ connection })
                    : this.context
              } catch (e) {
                console.error(e)
                throw e
              }
              return { ...connection, context }
            },
            keepAlive: subscriptionServerOptions.keepAlive,
          },
          {
            server: combinedServer,
            path: subscriptionServerOptions.path,
          },
        )
      }
    })
  }
}

function buildTypeDefsString(typeDefs: ITypeDefinitions): string {
  let typeDefinitions = mergeTypeDefs(typeDefs)

  // read from .graphql file if path provided
  if (typeDefinitions.endsWith('graphql')) {
    const schemaPath = path.resolve(typeDefinitions)

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`No schema found for path: ${schemaPath}`)
    }

    typeDefinitions = importSchema(schemaPath)
  }

  return typeDefinitions
}

function mergeTypeDefs(typeDefs: ITypeDefinitions): string {
  if (typeof typeDefs === 'string') {
    return typeDefs
  }

  if (typeof typeDefs === 'function') {
    typeDefs = typeDefs()
  }

  if (isDocumentNode(typeDefs)) {
    return print(typeDefs)
  }

  return typeDefs.reduce<string>((acc, t) => acc + '\n' + mergeTypeDefs(t), '')
}

function isDocumentNode(node: any): node is DocumentNode {
  return node.kind === 'Document'
}
