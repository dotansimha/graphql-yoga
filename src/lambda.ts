import { graphqlLambda } from 'apollo-server-lambda'
import * as fs from 'fs'
import { GraphQLSchema } from 'graphql'
import { importSchema } from 'graphql-import'
import lambdaPlayground from 'graphql-playground-middleware-lambda'
import { makeExecutableSchema } from 'graphql-tools'
import { deflate } from 'graphql-deduplicator'
import * as path from 'path'
import customFieldResolver from './customFieldResolver'

import { LambdaOptions, LambdaProps } from './types'

export class GraphQLServerLambda {
  options: LambdaOptions
  executableSchema: GraphQLSchema

  protected context: any

  constructor(props: LambdaProps) {
    const defaultOptions: LambdaOptions = {
      tracing: { mode: 'http-header' },
      deduplicator: true,
    }
    this.options = { ...defaultOptions, ...props.options }

    this.context = props.context

    if (props.schema) {
      this.executableSchema = props.schema
    } else if (props.typeDefs && props.resolvers) {
      let { directiveResolvers, schemaDirectives, typeDefs, resolvers } = props

      // read from .graphql file if path provided
      if (typeDefs.endsWith('graphql')) {
        const schemaPath = path.isAbsolute(typeDefs)
          ? path.resolve(typeDefs)
          : path.resolve(typeDefs)

        if (!fs.existsSync(schemaPath)) {
          throw new Error(`No schema found for path: ${schemaPath}`)
        }

        typeDefs = importSchema(schemaPath)
      }

      this.executableSchema = makeExecutableSchema({
        directiveResolvers,
        schemaDirectives,
        typeDefs,
        resolvers,
      })
    }
  }

  graphqlHandler = (event, context, callback) => {
    function callbackFilter(error, output) {
      const headers = output.headers || {}
      headers['Access-Control-Allow-Origin'] = '*'

      // eslint-disable-next-line no-param-reassign
      output.headers = headers

      callback(error, output)
    }

    const tracing = event => {
      const t = this.options.tracing
      if (typeof t === 'boolean') {
        return t
      } else if (t.mode === 'http-header') {
        return event.headers && event.headers['x-apollo-tracing'] !== undefined
      } else {
        return t.mode === 'enabled'
      }
    }

    const formatResponse = event => {
      if (!this.options.deduplicator) {
        return this.options.formatResponse
      }
      return (response, ...args) => {
        if (
          event.headers &&
          event.headers['X-GraphQL-Deduplicate'] &&
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

    const handler = graphqlLambda(async (event, lambdaContext) => {
      let apolloContext
      try {
        apolloContext =
          typeof this.context === 'function'
            ? await this.context({ event, context: lambdaContext })
            : this.context
      } catch (e) {
        console.error(e)
        throw e
      }

      if (typeof this.options.validationRules === 'function') {
        throw new Error(
          'validationRules as callback is only compatible with Express',
        )
      }

      return {
        schema: this.executableSchema,
        tracing: tracing(event),
        context: apolloContext,
        cacheControl: this.options.cacheControl,
        formatError: this.options.formatError,
        logFunction: this.options.logFunction,
        rootValue: this.options.rootValue,
        validationRules: this.options.validationRules,
        fieldResolver: this.options.fieldResolver || customFieldResolver,
        formatParams: this.options.formatParams,
        formatResponse: formatResponse(event),
        debug: this.options.debug,
      }
    })
    return handler(event, context, callbackFilter)
  }

  playgroundHandler = (event, lambdaContext, callback) => {
    return lambdaPlayground({
      endpoint: this.options.endpoint,
    })(event, lambdaContext, callback)
  }

  handler = (event, lambdaContext, callback) => {
    if (event.httpMethod === 'GET') {
      return this.playgroundHandler(event, lambdaContext, callback)
    } else {
      return this.graphqlHandler(event, lambdaContext, callback)
    }
  }
}
