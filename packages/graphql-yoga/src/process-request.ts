import { getOperationAST } from 'graphql';
import { GetEnvelopedFn } from '@envelop/core';
import { ExecutionArgs } from '@graphql-tools/executor';
import { OnResultProcess, ResultProcessor, ResultProcessorInput } from './plugins/types.js';
import { FetchAPI, GraphQLParams } from './types.js';

export async function processResult<TServerContext>({
  request,
  result,
  fetchAPI,
  serverContext,
  onResultProcessHooks,
}: {
  request: Request;
  result: ResultProcessorInput;
  fetchAPI: FetchAPI;
  serverContext: TServerContext;
  /**
   * Response Hooks
   */
  onResultProcessHooks: OnResultProcess<TServerContext>[];
}) {
  let resultProcessor: ResultProcessor | undefined;

  const acceptableMediaTypes: string[] = [];
  let acceptedMediaType = '*/*';
  let earlyResponse: Response | undefined;

  for (const onResultProcessHook of onResultProcessHooks) {
    await onResultProcessHook({
      request,
      acceptableMediaTypes,
      result,
      setResult(newResult) {
        result = newResult;
      },
      resultProcessor,
      setResultProcessor(newResultProcessor, newAcceptedMimeType) {
        resultProcessor = newResultProcessor;
        acceptedMediaType = newAcceptedMimeType;
      },
      serverContext,
      fetchAPI,
      endResponse(response) {
        earlyResponse = response;
      },
    });

    if (earlyResponse) {
      return earlyResponse;
    }
  }

  // If no result processor found for this result, return an error
  if (!resultProcessor) {
    return new fetchAPI.Response(null, {
      status: 406,
      statusText: 'Not Acceptable',
      headers: {
        accept: acceptableMediaTypes.join('; charset=utf-8, '),
      },
    });
  }

  return resultProcessor(result, fetchAPI, acceptedMediaType);
}

export async function processRequest({
  params,
  enveloped,
}: {
  params: GraphQLParams;
  enveloped: ReturnType<GetEnvelopedFn<unknown>>;
}) {
  // Parse GraphQLParams
  const document = enveloped.parse(params.query!);

  // Validate parsed Document Node
  const errors = enveloped.validate(enveloped.schema, document);

  if (errors.length > 0) {
    return { errors };
  }

  // Build the context for the execution
  const contextValue = await enveloped.contextFactory();
  const executionArgs: ExecutionArgs = {
    schema: enveloped.schema,
    document,
    contextValue,
    variableValues: params.variables,
    operationName: params.operationName,
    signal: contextValue?.request?.signal ?? undefined,
  };

  // Get the actual operation
  const operation = getOperationAST(document, params.operationName);

  // Choose the right executor
  const executeFn =
    operation?.operation === 'subscription' ? enveloped.subscribe : enveloped.execute;

  // Get the result to be processed
  return executeFn(executionArgs);
}
