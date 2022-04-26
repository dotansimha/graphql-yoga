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
  fetchAPI: Required<FetchAPI>
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
  let contextValue: TContext | undefined
  let document: DocumentNode
  let operation: OperationDefinitionNode | undefined

  if (request.method !== 'GET' && request.method !== 'POST') {
    throw new GraphQLYogaError('GraphQL only supports GET and POST requests.', {
      status: 405,
      headers: {
        Allow: 'GET, POST',
      },
    })
  }

  if (params.query == null) {
    throw new GraphQLYogaError('Must provide query string.', {
      status: 400,
    })
  }

  try {
    document = enveloped.parse(params.query)
  } catch (e: any) {
    e.extensions.status = 400
    throw e
  }

  const validationErrors = enveloped.validate(enveloped.schema, document)
  if (validationErrors.length > 0) {
    throw new GraphQLYogaError('Validation error', {
      status: 400,
      errors: validationErrors,
    })
  }

  operation = getOperationAST(document, params.operationName) ?? undefined

  if (!operation) {
    throw new GraphQLYogaError(
      'Could not determine what operation to execute.',
      {
        status: 400,
      },
    )
  }

  if (operation.operation === 'mutation' && request.method === 'GET') {
    throw new GraphQLYogaError(
      'Can only perform a mutation operation from a POST request.',
      {
        status: 405,
        headers: {
          Allow: 'POST',
        },
      },
    )
  }

  contextValue = (await enveloped.contextFactory()) as TContext

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
    new fetchAPI.Response(null)
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
