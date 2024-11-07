/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Plugin as EnvelopPlugin,
  OnExecuteHook,
  OnSubscribeHook,
  PromiseOrValue,
  RegisterContextErrorHandler,
  SetSchemaFn,
} from '@envelop/core';
import { ExecutionResult } from '@graphql-tools/utils';
import { ServerAdapterPlugin, type ServerAdapterInitialContext } from '@whatwg-node/server';
import { YogaServer } from '../server.js';
import {
  FetchAPI,
  GraphQLHTTPExtensions,
  GraphQLParams,
  MaybeArray,
  YogaInitialContext,
} from '../types.js';

export type Plugin<
  // eslint-disable-next-line @typescript-eslint/ban-types
  PluginContext extends Record<string, any> = {},
  // eslint-disable-next-line @typescript-eslint/ban-types
  TServerContext extends Record<string, any> = {},
  // eslint-disable-next-line @typescript-eslint/ban-types
  TUserContext = {},
> = EnvelopPlugin<YogaInitialContext & PluginContext> &
  ServerAdapterPlugin<TServerContext> & {
    /**
     * onExecute hook that is invoked before the execute function is invoked.
     */
    onExecute?: OnExecuteHook<YogaInitialContext & PluginContext & TUserContext>;
    /**
     * onSubscribe hook that is invoked before the subscribe function is called.
     * Return a OnSubscribeHookResult for hooking into phase after the subscribe function has been called.
     */
    onSubscribe?: OnSubscribeHook<YogaInitialContext & PluginContext & TUserContext>;
    /**
     * Invoked when a plugin is initialized.
     */
    onPluginInit?: OnPluginInitHook<YogaInitialContext & PluginContext & TUserContext>;
  } & {
    /**
     * Use this hook with your own risk. It is still experimental and may change in the future.
     * @internal
     */
    onYogaInit?: OnYogaInitHook<TServerContext>;
    /**
     * Use this hook with your own risk. It is still experimental and may change in the future.
     * @internal
     */
    onRequestParse?: OnRequestParseHook<TServerContext>;
    /**
     * Use this hook with your own risk. It is still experimental and may change in the future.
     * @internal
     */
    onParams?: OnParamsHook;
    /**
     * Use this hook with your own risk. It is still experimental and may change in the future.
     * @internal
     */
    onExecutionResult?: OnExecutionResultHook<TServerContext>;
    /**
     * Use this hook with your own risk. It is still experimental and may change in the future.
     * @internal
     */
    onResultProcess?: OnResultProcess<TServerContext>;
  };

export type OnYogaInitHook<TServerContext extends Record<string, any>> = (
  payload: OnYogaInitEventPayload<TServerContext>,
) => void;

export type OnYogaInitEventPayload<TServerContext extends Record<string, any>> = {
  yoga: YogaServer<TServerContext, any>;
};

export type OnRequestParseHook<TServerContext> = (
  payload: OnRequestParseEventPayload<TServerContext>,
) => PromiseOrValue<void | OnRequestParseHookResult>;

export type RequestParser = (
  request: Request,
) => PromiseOrValue<GraphQLParams> | PromiseOrValue<GraphQLParams[]>;

export interface OnRequestParseEventPayload<TServerContext> {
  request: Request;
  url: URL;
  requestParser: RequestParser | undefined;
  serverContext: TServerContext & ServerAdapterInitialContext;
  setRequestParser: (parser: RequestParser) => void;
}

export type OnRequestParseHookResult = {
  onRequestParseDone?: OnRequestParseDoneHook;
};

export type OnRequestParseDoneHook = (
  payload: OnRequestParseDoneEventPayload,
) => PromiseOrValue<void>;

export interface OnRequestParseDoneEventPayload {
  requestParserResult: GraphQLParams | GraphQLParams[];
  setRequestParserResult: (params: GraphQLParams | GraphQLParams[]) => void;
}

export type OnParamsHook = (payload: OnParamsEventPayload) => PromiseOrValue<void>;

export interface OnParamsEventPayload {
  params: GraphQLParams;
  request: Request;
  setParams: (params: GraphQLParams) => void;
  setResult: (result: ExecutionResult | AsyncIterable<ExecutionResult>) => void;
  fetchAPI: FetchAPI;
  /** Index of the batched request if it is a batched request */
  batchedRequestIndex?: number;
}

export type OnResultProcess<TServerContext> = (
  payload: OnResultProcessEventPayload<TServerContext>,
) => PromiseOrValue<void>;

export type ExecutionResultWithSerializer<TData = any, TExtensions = any> = ExecutionResult<
  TData,
  TExtensions
> & {
  stringify?: (result: ExecutionResult<TData, TExtensions>) => string;
};

export type OnExecutionResultHook<TServerContext> = (
  payload: OnExecutionResultEventPayload<TServerContext>,
) => PromiseOrValue<void>;

export interface OnExecutionResultEventPayload<TServerContext> {
  request: Request;
  result: ExecutionResultWithSerializer | AsyncIterable<ExecutionResultWithSerializer> | undefined;
  setResult(
    result: ExecutionResultWithSerializer | AsyncIterable<ExecutionResultWithSerializer>,
  ): void;
  context: TServerContext & ServerAdapterInitialContext & YogaInitialContext;
}

export type ResultProcessorInput =
  | MaybeArray<ExecutionResultWithSerializer>
  | AsyncIterable<ExecutionResultWithSerializer<any, { http?: GraphQLHTTPExtensions }>>;

export type ResultProcessor = (
  result: ResultProcessorInput,
  fetchAPI: FetchAPI,
  acceptedMediaType: string,
) => PromiseOrValue<Response>;

export interface OnResultProcessEventPayload<TServerContext> {
  request: Request;
  result: ResultProcessorInput;
  setResult(result: ResultProcessorInput): void;
  resultProcessor?: ResultProcessor;
  acceptableMediaTypes: string[];
  setResultProcessor(resultProcessor: ResultProcessor, acceptedMediaType: string): void;
  serverContext: TServerContext & ServerAdapterInitialContext;
}

/**
 * Payload forwarded to the onPluginInit hook.
 */
export type OnPluginInitEventPayload<PluginContext extends Record<string, any>> = {
  /**
   * Register a new plugin.
   */
  addPlugin: (newPlugin: Plugin<PluginContext>) => void;
  /**
   * A list of all currently active plugins.
   */
  plugins: Plugin<PluginContext>[];
  /**
   * Set the GraphQL schema.
   */
  setSchema: SetSchemaFn;
  /**
   * Register an error handler used for context creation.
   */
  registerContextErrorHandler: RegisterContextErrorHandler;
};

/**
 * Invoked when a plugin is initialized.
 */
export type OnPluginInitHook<ContextType extends Record<string, any>> = (
  options: OnPluginInitEventPayload<ContextType>,
) => void;
