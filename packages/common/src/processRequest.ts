import {
  getOperationAST,
  DocumentNode,
  OperationDefinitionNode,
  ExecutionArgs,
  GraphQLError,
} from 'graphql'
import { RequestProcessContext } from './types.js'
import { ResultProcessor } from './plugins/types.js'
import { AggregateError, createGraphQLError } from '@graphql-tools/utils'

export async function processRequest<TContext>({
  request,
  params,
  enveloped,
  fetchAPI,
  onResultProcessHooks,
}: RequestProcessContext<TContext>): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'POST') {
    throw createGraphQLError('GraphQL only supports GET and POST requests.', {
      extensions: {
        http: {
          status: 405,
          headers: {
            Allow: 'GET, POST',
          },
        },
      },
    })
  }

  if (params.query == null) {
    throw createGraphQLError('Must provide query string.', {
      extensions: {
        http: {
          status: 400,
          headers: {
            Allow: 'GET, POST',
          },
        },
      },
    })
  }

  let document: DocumentNode
  try {
    document = enveloped.parse(params.query)
  } catch (e: unknown) {
    if (e instanceof GraphQLError) {
      e.extensions.http = {
        status: 400,
      }
    }
    throw e
  }

  const operation: OperationDefinitionNode | undefined =
    getOperationAST(document, params.operationName) ?? undefined

  if (!operation) {
    throw createGraphQLError('Could not determine what operation to execute.', {
      extensions: {
        http: {
          status: 400,
        },
      },
    })
  }

  if (operation.operation === 'mutation' && request.method === 'GET') {
    throw createGraphQLError(
      'Can only perform a mutation operation from a POST request.',
      {
        extensions: {
          http: {
            status: 405,
            headers: {
              Allow: 'POST',
            },
          },
        },
      },
    )
  }

  const validationErrors = enveloped.validate(enveloped.schema, document)
  if (validationErrors.length > 0) {
    validationErrors.forEach((error) => {
      error.extensions.http = {
        status: 400,
      }
    })
    throw new AggregateError(validationErrors)
  }

  const contextValue = (await enveloped.contextFactory()) as TContext

  const executionArgs: ExecutionArgs = {
    schema: enveloped.schema,
    document,
    contextValue,
    variableValues: params.variables,
    operationName: params.operationName,
  }

  const executeFn =
    operation.operation === 'subscription'
      ? enveloped.subscribe
      : enveloped.execute

  const result = await executeFn(executionArgs)

  let resultProcessor: ResultProcessor | undefined

  for (const onResultProcessHook of onResultProcessHooks) {
    await onResultProcessHook({
      request,
      result,
      resultProcessor,
      setResultProcessor(newResultProcessor) {
        resultProcessor = newResultProcessor
      },
    })
  }

  if (!resultProcessor) {
    return new fetchAPI.Response(null, {
      status: 406,
      statusText: 'Not Acceptable',
    })
  }

  return resultProcessor(result, fetchAPI)
}
