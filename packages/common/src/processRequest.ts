import {
  getOperationAST,
  DocumentNode,
  OperationDefinitionNode,
  ExecutionArgs,
  ExecutionResult,
  GraphQLError,
} from 'graphql'
import { FetchAPI, RequestProcessContext } from './types'
import { encodeString } from './encodeString'
import { ResultProcessor } from './plugins/types'
import { GraphQLYogaError } from './GraphQLYogaError'

interface ErrorResponseParams {
  status?: number
  headers?: Record<string, string>
  errors: readonly Error[]
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
    errors: errors.map((error) =>
      error instanceof GraphQLError ? error : new GraphQLError(error.message),
    ),
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

export async function processRequest<TContext, TRootValue = {}>({
  request,
  params,
  enveloped,
  fetchAPI,
  onResultProcessHooks,
}: RequestProcessContext<TContext, TRootValue>): Promise<Response> {
  let document: DocumentNode

  if (request.method !== 'GET' && request.method !== 'POST') {
    return getErrorResponse({
      status: 405,
      headers: {
        Allow: 'GET, POST',
      },
      errors: [
        new GraphQLYogaError('GraphQL only supports GET and POST requests.'),
      ],
      fetchAPI,
    })
  }

  if (params.query == null) {
    return getErrorResponse({
      status: 400,
      errors: [new GraphQLYogaError('Must provide query string.')],
      fetchAPI,
    })
  }

  try {
    document = enveloped.parse(params.query)
  } catch (e: unknown) {
    return getErrorResponse({
      status: 400,
      errors: [e as GraphQLError],
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

  const operation: OperationDefinitionNode | undefined =
    getOperationAST(document, params.operationName) ?? undefined

  if (!operation) {
    return getErrorResponse({
      status: 400,
      errors: [
        new GraphQLYogaError('Could not determine what operation to execute.'),
      ],
      fetchAPI,
    })
  }

  if (operation.operation === 'mutation' && request.method === 'GET') {
    return getErrorResponse({
      status: 400,
      errors: [
        new GraphQLYogaError(
          'Can only perform a mutation operation from a POST request.',
        ),
      ],
      fetchAPI,
    })
  }

  const contextValue: TContext | undefined =
    (await enveloped.contextFactory()) as TContext

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
      context: contextValue,
      result,
      resultProcessor,
      setResultProcessor(newResultProcessor) {
        resultProcessor = newResultProcessor
      },
    })
  }

  return resultProcessor(result, fetchAPI)
}
