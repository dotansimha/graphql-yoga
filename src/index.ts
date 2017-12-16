import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as cors from 'cors'
import expressPlayground from 'graphql-playground-middleware-express'
import { SubscriptionServer } from 'subscriptions-transport-ws'
import { createServer } from 'http'
import { execute, subscribe, GraphQLSchema } from 'graphql'
import { apolloUploadExpress, GraphQLUpload } from 'apollo-upload-server'
import { graphqlExpress } from 'apollo-server-express'
import { makeExecutableSchema } from 'graphql-tools'
export { PubSub } from 'graphql-subscriptions'
import { Props, Options } from './types'

export { Options }

export class GraphQLServer {
  express: express.Application
  subscriptionServer: SubscriptionServer | null

  schema: GraphQLSchema
  private context: any
  private options: Options

  constructor(props: Props) {
    const defaultOptions: Options = {
      disableSubscriptions: false,
      tracing: { mode: 'http-header' },
      port: process.env.PORT ? parseInt(process.env.PORT, 10) : 4000,
      endpoint: '/',
      subscriptionsEndpoint: '/',
      playgroundEndpoint: '/',
      disablePlayground: false,
    }
    this.options = { ...defaultOptions, ...props.options }

    if (!this.options.disableSubscriptions) {
      this.options.subscriptionsEndpoint = undefined
    }

    this.express = express()
    this.subscriptionServer = null
    this.context = props.context

    if (props.schema) {
      this.schema = props.schema
    } else {
      const { typeDefs, resolvers } = props
      const uploadMixin = typeDefs.includes('scalar Upload')
        ? { Upload: GraphQLUpload }
        : {}
      this.schema = makeExecutableSchema({
        typeDefs,
        resolvers: {
          ...uploadMixin,
          ...resolvers,
        },
      })
    }
  }

  start(callback: (() => void) = () => null): Promise<void> {
    const app = this.express

    const {
      port,
      endpoint,
      disablePlayground,
      disableSubscriptions,
      playgroundEndpoint,
      subscriptionsEndpoint,
      uploads,
    } = this.options

    // CORS support
    if (this.options.cors) {
      app.use(cors(this.options.cors))
    } else if (this.options.cors !== false) {
      app.use(cors())
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

    app.post(
      endpoint,
      bodyParser.json(),
      apolloUploadExpress(uploads),
      graphqlExpress(request => ({
        schema: this.schema,
        tracing: tracing(request),
        context:
          typeof this.context === 'function'
            ? this.context({ request })
            : this.context,
      })),
    )

    if (!disablePlayground) {
      const isDev =
        process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'development'
      const playgroundOptions = isDev
        ? { useGraphQLConfig: true, env: process.env }
        : { endpoint, subscriptionsEndpoint }

      app.get(playgroundEndpoint, expressPlayground(playgroundOptions))
    }

    return new Promise((resolve, reject) => {
      if (disableSubscriptions) {
        app.listen(port, () => {
          callback()
          resolve()
        })
      } else {
        const combinedServer = createServer(app)

        combinedServer.listen(port, () => {
          callback()
          resolve()
        })

        this.subscriptionServer = SubscriptionServer.create(
          {
            schema: this.schema,
            execute,
            subscribe,
            onOperation: (message, connection, webSocket) => {
              return {
                ...connection,
                context:
                  typeof this.context === 'function'
                    ? this.context({ connection })
                    : this.context,
              }
            },
          },
          {
            server: combinedServer,
            path: subscriptionsEndpoint,
          },
        )
      }
    })
  }
}
