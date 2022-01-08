import { Server } from '@graphql-yoga/core'
import { handleOptions } from './handleOptions'
import { Response } from 'cross-undici-fetch'
import { getGraphQLParameters } from './getGraphQLParameters'
import { processRequest } from './processRequest'
import { shouldRenderGraphiQL, renderGraphiQL } from './graphiql'
import { InitialContext } from '.'

export async function handleRequest<
  TContext extends InitialContext,
  TRootValue,
>(this: Server<TContext, TRootValue>, request: Request) {
  try {
    if (this.corsOptionsFactory != null && request.method === 'OPTIONS') {
      return handleOptions(request, this.corsOptionsFactory)
    }

    this.logger.debug(`Checking if GraphiQL Request`)
    if (shouldRenderGraphiQL(request) && this.graphiql) {
      const graphiQLBody = renderGraphiQL(this.graphiql)
      return new Response(graphiQLBody, {
        headers: {
          'Content-Type': 'text/html',
        },
        status: 200,
      })
    }

    this.logger.debug(`Extracting GraphQL Parameters`)
    const { query, variables, operationName } = await getGraphQLParameters(
      request,
    )

    const { execute, validate, subscribe, parse, contextFactory, schema } =
      this.getEnveloped<InitialContext>({
        request,
        query,
        variables,
        operationName,
      })

    this.logger.debug(`Processing Request by Helix`)

    return await processRequest({
      request,
      query,
      variables,
      operationName,
      execute,
      validate,
      subscribe,
      parse,
      contextFactory,
      schema,
    })
  } catch (err: any) {
    this.logger.error(err.message, err)
    const response = new Response(err.message, {
      status: 500,
      statusText: 'Internal Server Error',
    })
    return response
  }
}
