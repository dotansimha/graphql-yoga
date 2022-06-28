import {
  getOperationAST,
  DocumentNode,
  OperationDefinitionNode,
  ExecutionArgs,
  ExecutionResult,
  GraphQLError,
} from 'graphql'
import { FetchAPI, RequestProcessContext } from './types.js'
import { encodeString } from './encodeString.js'
import { ResultProcessor } from './plugins/types.js'
import { handleError } from './GraphQLYogaError.js'

interface ErrorResponseParams {
  status?: number
  headers?: Record<string, string>
  errors: readonly GraphQLError[]
  fetchAPI: FetchAPI
}

export function getErrorResponse({
  status = 500,
  headers = {},
  errors,
  fetchAPI,
}: ErrorResponseParams): Response {
  const payload: ExecutionResult = {
    data: null,
    errors,
  }
  if (errors.length === 1) {
    const error = errors[0]
    if (error.extensions?.status) {
      status = error.extensions.status
    }
  }
  const decodedString = encodeString(JSON.stringify(payload))
  return new fetchAPI.Response(decodedString, {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
      'Content-Length': decodedString.byteLength.toString(),
    },
  })
}

export async function processRequest<TContext>({
  request,
  params,
  enveloped,
  fetchAPI,
  onResultProcessHooks,
}: RequestProcessContext<TContext>): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'POST') {
    return getErrorResponse({
      status: 405,
      headers: {
        Allow: 'GET, POST',
      },
      errors: handleError('GraphQL only supports GET and POST requests.'),
      fetchAPI,
    })
  }

  if (params.query == null) {
    return getErrorResponse({
      status: 400,
      errors: handleError('Must provide query string.'),
      fetchAPI,
    })
  }

  let document: DocumentNode
  try {
    document = enveloped.parse(params.query)
  } catch (e: unknown) {
    return getErrorResponse({
      status: 400,
      errors: handleError(e),
      fetchAPI,
    })
  }

  const operation: OperationDefinitionNode | undefined =
    getOperationAST(document, params.operationName) ?? undefined

  if (!operation) {
    return getErrorResponse({
      status: 400,
      errors: handleError('Could not determine what operation to execute.'),
      fetchAPI,
    })
  }

  if (operation.operation === 'mutation' && request.method === 'GET') {
    return getErrorResponse({
      status: 405,
      headers: {
        Allow: 'POST',
      },
      errors: handleError(
        'Can only perform a mutation operation from a POST request.',
      ),
      fetchAPI,
    })
  }

  const validationErrors = enveloped.validate(enveloped.schema, document)
  if (validationErrors.length > 0) {
    return getErrorResponse({
      status: 400,
      errors: validationErrors,
      fetchAPI,
    })
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

  let resultProcessor: ResultProcessor = (_, fetchAPI) =>
    new fetchAPI.Response(null, {
      status: 406,
      statusText: 'Not Acceptable',
    })

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

  return resultProcessor(result, fetchAPI)
}
