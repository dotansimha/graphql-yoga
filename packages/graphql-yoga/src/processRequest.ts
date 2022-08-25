import { getOperationAST, ExecutionArgs } from 'graphql'
import { FetchAPI, GraphQLParams } from './types.js'
import {
  OnResultProcess,
  ResultProcessor,
  ResultProcessorInput,
} from './plugins/types.js'
import { GetEnvelopedFn } from '@envelop/core'
import { getMediaTypesForRequest } from './plugins/resultProcessor/accept.js'

export async function processResult({
  request,
  result,
  fetchAPI,
  onResultProcessHooks,
}: {
  request: Request
  result: ResultProcessorInput
  fetchAPI: FetchAPI
  /**
   * Response Hooks
   */
  onResultProcessHooks: OnResultProcess[]
}) {
  let resultProcessor: ResultProcessor | undefined

  const acceptableMediaTypes = new Set<string>()
  let acceptedMediaType = '*/*'

  for (const onResultProcessHook of onResultProcessHooks) {
    await onResultProcessHook({
      request,
      acceptableMediaTypes,
      result,
      resultProcessor,
      setResultProcessor(newResultProcessor, newAcceptedMimeType) {
        resultProcessor = newResultProcessor
        acceptedMediaType = newAcceptedMimeType
      },
    })
  }

  // If no result processor found for this result, return an error
  if (!resultProcessor) {
    return new fetchAPI.Response(null, {
      status: 406,
      statusText: 'Not Acceptable',
      headers: {
        accept: [...acceptableMediaTypes].join('; charset=utf-8, '),
      },
    })
  }

  return resultProcessor(result, fetchAPI, acceptedMediaType)
}

export async function processRequest<TContext>({
  params,
  enveloped,
}: {
  params: GraphQLParams
  enveloped: ReturnType<GetEnvelopedFn<TContext>>
}) {
  // Parse GraphQLParams
  const document = enveloped.parse(params.query!)

  // Validate parsed Document Node
  enveloped.validate(enveloped.schema, document)

  // Build the context for the execution
  const contextValue = (await enveloped.contextFactory()) as TContext

  const executionArgs: ExecutionArgs = {
    schema: enveloped.schema,
    document,
    contextValue,
    variableValues: params.variables,
    operationName: params.operationName,
  }

  // Get the actual operation
  const operation = getOperationAST(document, params.operationName)

  // Choose the right executor
  const executeFn =
    operation?.operation === 'subscription'
      ? enveloped.subscribe
      : enveloped.execute

  // Get the result to be processed
  return executeFn(executionArgs)
}
