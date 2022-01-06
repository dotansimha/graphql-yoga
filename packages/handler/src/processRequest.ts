import {
  execute as defaultExecute,
  getOperationAST,
  parse as defaultParse,
  subscribe as defaultSubscribe,
  validate as defaultValidate,
  DocumentNode,
  OperationDefinitionNode,
  ExecutionResult,
} from 'graphql'
import { isAsyncIterable } from '@graphql-tools/utils'
import {
  ExecutionPatchResult,
  InitialContext,
  RequestProcessContext,
} from './types'
import {
  getMultipartResponse,
  getPushResponse,
  getRegularResponse,
  getErrorResponse,
} from './getResponse'

async function parseQuery(
  query: string | DocumentNode,
  parse: typeof defaultParse,
): Promise<DocumentNode> {
  if (typeof query !== 'string' && query.kind === 'Document') {
    return query
  }
  return parse(query as string)
}

const getExecutableOperation = (
  document: DocumentNode,
  operationName?: string,
): OperationDefinitionNode => {
  const operation = getOperationAST(document, operationName)

  if (!operation) {
    throw new Error('Could not determine what operation to execute.')
  }

  return operation
}

export const processRequest = async <TContext, TRootValue = {}>({
  contextFactory,
  execute = defaultExecute,
  operationName,
  parse = defaultParse,
  query,
  request,
  rootValueFactory,
  schema,
  subscribe = defaultSubscribe,
  validate = defaultValidate,
  variables,
}: RequestProcessContext<TContext, TRootValue>): Promise<Response> => {
  let context: TContext | undefined
  let rootValue: TRootValue | undefined
  let document: DocumentNode | undefined
  let operation: OperationDefinitionNode | undefined

  const isEventStream = request.headers.get('accept') === 'text/event-stream'

  try {
    if (request.method !== 'GET' && request.method !== 'POST') {
      return getErrorResponse({
        status: 405,
        message: 'GraphQL only supports GET and POST requests.',
        headers: {
          Allow: 'GET, POST',
        },
        isEventStream,
      })
    }

    if (query == null) {
      return getErrorResponse({
        status: 400,
        message: 'Must provide query string.',
        isEventStream,
      })
    }

    try {
      document = await parseQuery(query, parse)
    } catch (e: any) {
      return getErrorResponse({
        status: 400,
        message: 'Syntax error',
        errors: [e],
        isEventStream,
      })
    }

    const validationErrors = validate(schema, document)
    if (validationErrors.length > 0) {
      return getErrorResponse({
        status: 400,
        message: 'Invalid query.',
        errors: validationErrors,
        isEventStream,
      })
    }

    operation = getExecutableOperation(document, operationName)

    if (operation.operation === 'mutation' && request.method === 'GET') {
      return getErrorResponse({
        status: 405,
        message: 'Can only perform a mutation operation from a POST request.',
        headers: {
          Allow: 'POST',
        },
        isEventStream,
      })
    }

    let variableValues: { [name: string]: any } | undefined

    try {
      if (variables) {
        variableValues =
          typeof variables === 'string' ? JSON.parse(variables) : variables
      }
    } catch (_error) {
      return getErrorResponse({
        message: 'Variables are invalid JSON.',
        status: 400,
        isEventStream,
      })
    }

    const initialContext: InitialContext = {
      operationName,
      query,
      request,
      variables,
    }

    context = contextFactory
      ? await contextFactory(initialContext)
      : ({} as TContext)
    rootValue = rootValueFactory
      ? await rootValueFactory(initialContext)
      : ({} as TRootValue)

    if (operation.operation === 'subscription') {
      const result = await subscribe({
        schema,
        document,
        rootValue,
        contextValue: context,
        variableValues,
        operationName,
      })

      // If errors are encountered while subscribing to the operation, an execution result
      // instead of an AsyncIterable.
      if (isAsyncIterable<ExecutionPatchResult>(result)) {
        return getPushResponse(result)
      } else {
        if (isEventStream) {
          return getPushResponse(result)
        } else {
          return getRegularResponse(result)
        }
      }
    } else {
      const result = await execute({
        schema,
        document,
        rootValue,
        contextValue: context,
        variableValues,
        operationName,
      })

      // Operations that use @defer, @stream and @live will return an `AsyncIterable` instead of an
      // execution result.
      if (isAsyncIterable<ExecutionPatchResult>(result)) {
        return isEventStream
          ? getPushResponse(result)
          : getMultipartResponse(result)
      } else {
        return getRegularResponse(result)
      }
    }
  } catch (error: any) {
    const errors = Array.isArray(error) ? error : error.errors || [error]
    return getErrorResponse({
      message: 'Error',
      status: 500,
      errors,
      isEventStream,
    })
  }
}
