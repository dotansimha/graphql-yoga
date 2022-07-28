import { getOperationAST, ExecutionArgs } from 'graphql'
import { FetchAPI, GraphQLParams } from './types.js'
import {
  OnResultProcess,
  ResultProcessor,
  ResultProcessorInput,
} from './plugins/types.js'
import { GetEnvelopedFn } from '@envelop/core'

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
  let resultProcessor: ResultProcessor<any> | undefined

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

  // If no result processor found for this result, return an error
  if (!resultProcessor) {
    return new fetchAPI.Response(null, {
      status: 406,
      statusText: 'Not Acceptable',
    })
  }

  return resultProcessor(result, fetchAPI)
}

export async function processRequest<TContext>({
  params,
  enveloped,
}: {
  params: GraphQLParams
  enveloped: ReturnType<GetEnvelopedFn<TContext>>
}): Promise<ResultProcessorInput> {
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
  const result = await executeFn(executionArgs)

  return result
}
