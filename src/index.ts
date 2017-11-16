import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as cors from 'cors'
import expressPlayground from 'graphql-playground-middleware-express'
import { SubscriptionServer } from 'subscriptions-transport-ws'
import { createServer } from 'http'
import { execute, subscribe, GraphQLSchema } from 'graphql'
import { graphqlExpress } from 'apollo-server-express'
import { makeExecutableSchema } from 'graphql-tools'
export { PubSub } from 'graphql-subscriptions'
import { Props, Options } from './types'

export { Options }

export class GraphQLServer {

  app: express.Application
  subscriptionServer: SubscriptionServer | null

  private schema: GraphQLSchema
  private context: any
  private options: Options

  constructor(props: Props) {

    const defaultOptions = {
      disableSubscriptions: false,
      port: process.env.PORT ? parseInt(process.env.PORT, 10) : 4000,
      endpoint: '/',
      subscriptionsEndpoint: '/',
      playgroundEndpoint: '/',
      disablePlayground: false,
    }
    this.options = { ...defaultOptions, ...props.options }

    this.app = express()
    this.subscriptionServer = null
    this.context = props.context

    if (props.schema) {
      this.schema = props.schema
    } else {
      const { typeDefs, resolvers } = props
      this.schema = makeExecutableSchema({ typeDefs, resolvers })
    }
  }

  start(callback: (() => void) = (() => null)): Promise<void> {
    const app = this.app

    const {
      port,
      endpoint,
      disablePlayground,
      disableSubscriptions,
      playgroundEndpoint,
      subscriptionsEndpoint,
    } = this.options

    // CORS support
    if (this.options.cors) {
      app.use(cors(this.options.cors))
    } else if (this.options.cors !== false) {
      app.use(cors())
    }

    if (typeof this.context === 'function') {
      app.post(endpoint, bodyParser.json(), graphqlExpress(req => ({ schema: this.schema, context: this.context(req) })))
    } else {
      app.post(endpoint, bodyParser.json(), graphqlExpress({ schema: this.schema, context: this.context }))
    }

    if (!disablePlayground) {
      app.get(playgroundEndpoint, expressPlayground({
        endpoint,
        subscriptionEndpoint: disableSubscriptions ? undefined : subscriptionsEndpoint,
      }))
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
            onOperation: (message, params, webSocket) => {
              return { ...params, context: this.context }
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
