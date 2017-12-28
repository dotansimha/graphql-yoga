import * as express from 'express'
import * as cors from 'cors'
import * as fs from 'fs'
import * as path from 'path'
import expressPlayground from 'graphql-playground-middleware-express'
import { SubscriptionServer } from 'subscriptions-transport-ws'
import { createServer } from 'http'
import { execute, subscribe, GraphQLSchema } from 'graphql'
import { apolloUploadExpress, GraphQLUpload } from 'apollo-upload-server'
import { graphqlExpress } from 'apollo-server-express'
import { makeExecutableSchema } from 'graphql-tools'
export { PubSub, withFilter } from 'graphql-subscriptions'
import { Props, Options } from './types'

export { Options }

export class GraphQLServer {
  express: express.Application
  subscriptionServer: SubscriptionServer | null
  options: Options
  executableSchema: GraphQLSchema

  protected context: any

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

    // CORS support
    if (this.options.cors) {
      this.express.use(cors(this.options.cors))
    } else if (this.options.cors !== false) {
      this.express.use(cors())
    }

    this.express.post(
      this.options.endpoint,
      express.json(),
      apolloUploadExpress(this.options.uploads),
    )

    this.subscriptionServer = null
    this.context = props.context

    if (props.schema) {
      this.executableSchema = props.schema
    } else if (props.typeDefs && props.resolvers) {
      let { typeDefs, resolvers } = props

      // read from .graphql file if path provided
      if (typeDefs.endsWith('graphql')) {
        const schemaPath = path.isAbsolute(typeDefs)
          ? path.resolve(typeDefs)
          : path.resolve(typeDefs)

        if (!fs.existsSync(schemaPath)) {
          throw new Error(`No schema found for path: ${schemaPath}`)
        }

        typeDefs = fs.readFileSync(schemaPath, 'utf8')
      }

      const uploadMixin = typeDefs.includes('scalar Upload')
        ? { Upload: GraphQLUpload }
        : {}
      this.executableSchema = makeExecutableSchema({
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
    } = this.options

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
      graphqlExpress(async request => ({
        schema: this.executableSchema,
        tracing: tracing(request),
        context:
          typeof this.context === 'function'
            ? await this.context({ request })
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

    if (!this.executableSchema) {
      throw new Error('No schema defined')
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
            schema: this.executableSchema,
            execute,
            subscribe,
            onOperation: async (message, connection, webSocket) => {
              return {
                ...connection,
                context:
                  typeof this.context === 'function'
                    ? await this.context({ connection })
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
