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
import {
  execute,
  GraphQLSchema,
  subscribe,
  DocumentNode,
  print,
  GraphQLFieldResolver,
  ExecutionResult,
} from 'graphql'
import { importSchema } from 'graphql-import'
import { deflate } from 'graphql-deduplicator'
import expressPlayground from 'graphql-playground-middleware-express'
import {
  makeExecutableSchema,
  addMockFunctionsToSchema,
  defaultMergedResolver,
} from 'graphql-tools'
import {
  applyMiddleware as applyFieldMiddleware,
  FragmentReplacement,
} from 'graphql-middleware'
import { createServer, Server as HttpServer } from 'http'
import { createServer as createHttpsServer, Server as HttpsServer } from 'https'
import * as path from 'path'
import { SubscriptionServer } from 'subscriptions-transport-ws'

import {
  SubscriptionServerOptions,
  Options,
  OptionsWithHttps,
  OptionsWithoutHttps,
  Props,
  ValidationRules,
} from './types'
import { ITypeDefinitions } from 'graphql-tools/dist/Interfaces'
import { defaultErrorFormatter } from './defaultErrorFormatter'

export { MockList } from 'graphql-tools'
export { PubSub, withFilter } from 'graphql-subscriptions'
export { Options, OptionsWithHttps, OptionsWithoutHttps }
export { GraphQLServerLambda } from './lambda'

// TODO remove once `@types/graphql` is fixed for `execute`
type ExecuteFunction = (
  schema: GraphQLSchema,
  document: DocumentNode,
  rootValue?: any,
  contextValue?: any,
  variableValues?: {
    [key: string]: any
  },
  operationName?: string,
  fieldResolver?: GraphQLFieldResolver<any, any>,
) => Promise<ExecutionResult> | AsyncIterator<ExecutionResult>

export class GraphQLServer {
  express: express.Application
  subscriptionServer: SubscriptionServer | null
  subscriptionServerOptions: SubscriptionServerOptions | null = null
  options: Options = {
    tracing: { mode: 'http-header' },
    port: process.env.PORT || 4000,
    deduplicator: true,
    endpoint: '/',
    subscriptions: '/',
    playground: '/',
    getEndpoint: false,
  }
  executableSchema: GraphQLSchema
  context: any

  private middlewareFragmentReplacements: FragmentReplacement[] = []

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
      const {
        directiveResolvers,
        schemaDirectives,
        resolvers,
        resolverValidationOptions,
        typeDefs,
        mocks,
      } = props

      const typeDefsString = mergeTypeDefs(typeDefs)

      const uploadMixin = typeDefsString.includes('scalar Upload')
        ? { Upload: GraphQLUpload }
        : {}

      this.executableSchema = makeExecutableSchema({
        directiveResolvers,
        schemaDirectives,
        typeDefs: typeDefsString,
        resolvers: Array.isArray(resolvers)
          ? [uploadMixin, ...resolvers]
          : [uploadMixin, resolvers],

        resolverValidationOptions,
      })

      if (mocks) {
        addMockFunctionsToSchema({
          schema: this.executableSchema,
          mocks: typeof mocks === 'object' ? mocks : undefined,
          preserveResolvers: false,
        })
      }
    }

    if (props.middlewares) {
      const { schema, fragmentReplacements } = applyFieldMiddleware(
        this.executableSchema,
        ...props.middlewares,
      )

      this.executableSchema = schema
      this.middlewareFragmentReplacements = fragmentReplacements
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

  createHttpServer(options: OptionsWithoutHttps): HttpServer
  createHttpServer(options: OptionsWithHttps): HttpsServer
  createHttpServer(options: Options): HttpServer | HttpsServer {
    const app = this.express

    this.options = { ...this.options, ...options }

    if (this.options.subscriptions) {
      this.subscriptionServerOptions =
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

    const formatResponse = (req: express.Request) => {
      if (!this.options.deduplicator) {
        return this.options.formatResponse
      }
      return (response, ...args) => {
        if (
          req.get('X-GraphQL-Deduplicate') &&
          response.data &&
          !response.data.__schema
        ) {
          response.data = deflate(response.data)
        }

        return this.options.formatResponse
          ? this.options.formatResponse(response, ...args)
          : response
      }
    }

    // CORS support
    if (this.options.cors) {
      app.use(cors(this.options.cors))
    } else if (this.options.cors !== false) {
      app.use(cors())
    }

    app.post(
      this.options.endpoint,
      bodyParser.graphql(this.options.bodyParserOptions),
    )

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
      graphqlExpress(async (request, response) => {
        let context
        try {
          context =
            typeof this.context === 'function'
              ? await this.context({
                  request,
                  response,
                  fragmentReplacements: this.middlewareFragmentReplacements,
                })
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
          validationRules:
            typeof this.options.validationRules === 'function'
              ? this.options.validationRules(request, response)
              : this.options.validationRules,
          fieldResolver: this.options.fieldResolver || defaultMergedResolver,
          formatParams: this.options.formatParams,
          formatResponse: formatResponse(request),
          debug: this.options.debug,
          context,
        }
      }),
    )

    // Only add GET endpoint if opted in
    if (this.options.getEndpoint) {
      app.get(
        this.options.getEndpoint === true
          ? this.options.endpoint
          : this.options.getEndpoint,
        graphqlExpress(async (request, response) => {
          let context
          try {
            context =
              typeof this.context === 'function'
                ? await this.context({ request, response })
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
            validationRules: this.options.validationRules as ValidationRules,
            fieldResolver: this.options.fieldResolver || defaultMergedResolver,
            formatParams: this.options.formatParams,
            formatResponse: this.options.formatResponse,
            debug: this.options.debug,
            context,
          }
        }),
      )
    }

    if (this.options.playground) {
      const playgroundOptions = this.subscriptionServerOptions
        ? {
            endpoint: this.options.endpoint,
            subscriptionsEndpoint: this.subscriptionServerOptions.path,
          }
        : { endpoint: this.options.endpoint }

      app.get(this.options.playground, expressPlayground(playgroundOptions))
    }

    if (!this.executableSchema) {
      throw new Error('No schema defined')
    }

    const server = this.options.https
      ? createHttpsServer(this.options.https, app)
      : createServer(app)

    if (this.subscriptionServerOptions) {
      this.createSubscriptionServer(server)
    }

    return server
  }

  start(
    options: Options,
    callback?: ((options: Options) => void),
  ): Promise<HttpServer | HttpsServer>
  start(
    callback?: ((options: Options) => void),
  ): Promise<HttpServer | HttpsServer>
  start(
    optionsOrCallback?: Options | ((options: Options) => void),
    callback?: ((options: Options) => void),
  ): Promise<HttpServer | HttpsServer> {
    const options =
      optionsOrCallback && typeof optionsOrCallback === 'function'
        ? {}
        : optionsOrCallback
    const callbackFunc = callback
      ? callback
      : optionsOrCallback && typeof optionsOrCallback === 'function'
        ? optionsOrCallback
        : () => null

    const server = this.createHttpServer(options as Options)

    return new Promise((resolve, reject) => {
      const combinedServer = server
      combinedServer.listen(this.options.port, () => {
        callbackFunc({
          ...this.options,
          port: combinedServer.address().port,
        })
        resolve(combinedServer)
      })
    })
  }

  private createSubscriptionServer(combinedServer: HttpServer | HttpsServer) {
    this.subscriptionServer = SubscriptionServer.create(
      {
        schema: this.executableSchema,
        // TODO remove once `@types/graphql` is fixed for `execute`
        execute: execute as ExecuteFunction,
        subscribe,
        onConnect: this.subscriptionServerOptions.onConnect
          ? this.subscriptionServerOptions.onConnect
          : async (connectionParams, webSocket) => ({ ...connectionParams }),
        onDisconnect: this.subscriptionServerOptions.onDisconnect,
        onOperation: async (message, connection, webSocket) => {
          // The following should be replaced when SubscriptionServer accepts a formatError
          // parameter for custom error formatting.
          // See https://github.com/apollographql/subscriptions-transport-ws/issues/182
          connection.formatResponse = value => ({
            ...value,
            errors:
              value.errors &&
              value.errors.map(
                this.options.formatError || defaultErrorFormatter,
              ),
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
        keepAlive: this.subscriptionServerOptions.keepAlive,
      },
      {
        server: combinedServer,
        path: this.subscriptionServerOptions.path,
      },
    )
  }
}

function mergeTypeDefs(typeDefs: ITypeDefinitions): string {
  if (typeof typeDefs === 'string') {
    if (typeDefs.endsWith('graphql')) {
      const schemaPath = path.resolve(typeDefs)

      if (!fs.existsSync(schemaPath)) {
        throw new Error(`No schema found for path: ${schemaPath}`)
      }

      return importSchema(schemaPath)
    } else {
      return typeDefs
    }
  }

  if (typeof typeDefs === 'function') {
    typeDefs = typeDefs()
  }

  if (isDocumentNode(typeDefs)) {
    return print(typeDefs)
  }

  if (Array.isArray(typeDefs)) {
    return typeDefs.reduce<string>(
      (acc, t) => acc + '\n' + mergeTypeDefs(t),
      '',
    )
  }

  throw new Error(
    'Typedef is not string, function, DocumentNode or array of previous',
  )
}

function isDocumentNode(node: any): node is DocumentNode {
  return node.kind === 'Document'
}
