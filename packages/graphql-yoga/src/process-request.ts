import { ExecutionArgs, getOperationAST } from 'graphql';
import { GetEnvelopedFn } from '@envelop/core';
import { isPromise } from '@graphql-tools/utils';
import { iterateAsyncVoid } from '@whatwg-node/server';
import {
  OnResultProcess,
  OnResultProcessEventPayload,
  ResultProcessor,
  ResultProcessorInput,
} from './plugins/types.js';
import { FetchAPI, GraphQLParams } from './types.js';

export function processResult({
  request,
  result,
  fetchAPI,
  onResultProcessHooks,
}: {
  request: Request;
  result: ResultProcessorInput;
  fetchAPI: FetchAPI;
  /**
   * Response Hooks
   */
  onResultProcessHooks: OnResultProcess[];
}) {
  let resultProcessor: ResultProcessor | undefined;

  const acceptableMediaTypes: string[] = [];
  let acceptedMediaType = '*/*';

  function executeResultProcessor() {
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

  const onResultProcessHookPayload: OnResultProcessEventPayload = {
    request,
    acceptableMediaTypes,
    get result() {
      return result;
    },
    setResult(newResult) {
      result = newResult;
    },
    get resultProcessor() {
      return resultProcessor;
    },
    setResultProcessor(newResultProcessor, newAcceptedMimeType) {
      resultProcessor = newResultProcessor;
      acceptedMediaType = newAcceptedMimeType;
    },
  };

  const iterationRes$ = iterateAsyncVoid(onResultProcessHooks, onResultProcessHook =>
    onResultProcessHook(onResultProcessHookPayload),
  );

  if (isPromise(iterationRes$)) {
    return iterationRes$.then(executeResultProcessor);
  }

  return executeResultProcessor();
}

function processExecutionArgs({
  executionArgs,
  enveloped,
}: {
  executionArgs: ExecutionArgs;
  enveloped: ReturnType<GetEnvelopedFn<unknown>>;
}) {
  // Get the actual operation
  const operation = getOperationAST(executionArgs.document, executionArgs.operationName);

  // Choose the right executor
  const executeFn =
    operation?.operation === 'subscription' ? enveloped.subscribe : enveloped.execute;

  // Get the result to be processed
  return executeFn(executionArgs);
}

export function processRequest({
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

  function processContextValue(contextValue: unknown) {
    const executionArgs: ExecutionArgs = {
      schema: enveloped.schema,
      document,
      contextValue,
      variableValues: params.variables,
      operationName: params.operationName,
    };

    return processExecutionArgs({ executionArgs, enveloped });
  }

  // Build the context for the execution
  const contextValue$ = enveloped.contextFactory();

  if (isPromise(contextValue$)) {
    return contextValue$.then(processContextValue);
  }

  return processContextValue(contextValue$);
}
