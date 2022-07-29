import { getOperationAST, ExecutionArgs } from 'graphql'
import { RequestProcessContext } from './types.js'
import { ResultProcessor, ResultProcessorInput } from './plugins/types.js'

export async function processRequest<TContext>({
  request,
  params,
  enveloped,
  fetchAPI,
  onResultProcessHooks,
}: RequestProcessContext<TContext>): Promise<Response> {
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
  let result: ResultProcessorInput = await executeFn(executionArgs)

  let resultProcessor: ResultProcessor | undefined

  for (const onResultProcessHook of onResultProcessHooks) {
    await onResultProcessHook({
      request,
      result,
      resultProcessor,
      setResult: (newResult) => (result = newResult),
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
