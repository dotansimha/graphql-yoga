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
import { Props } from './types'

export class GraphQLServer {

  private schema: GraphQLSchema
  private context: any

  constructor (props: Props) {
    this.context = props.context

    if (props.schema) {
      this.schema = props.schema
    } else {
      const { typeDefs, resolvers } = props
      this.schema = makeExecutableSchema({ typeDefs, resolvers })
    }
  }

  start (port: number = 3000, callback: (() => void) = () => null) {
    const app = express()

    // enable CORS requests
    app.use(cors())

    app.post('/', bodyParser.json(), graphqlExpress({ schema: this.schema, context: this.context }))
    app.get('/', expressPlayground({
      endpoint: '/',
      subscriptionEndpoint: `ws://localhost:${port}/`,
    }))

    const combinedServer = createServer(app)

    combinedServer.listen(port, callback)

    SubscriptionServer.create(
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
        path: '/',
      },
    )
  }
}
