import {
  Plugin as EnvelopPlugin,
  PromiseOrValue,
  OnExecuteHook,
  OnSubscribeHook,
} from '@envelop/core'
import { ExecutionResult } from 'graphql'
import {
  ExecutionPatchResult,
  FetchAPI,
  GraphQLParams,
  MaybeArray,
  YogaInitialContext,
} from '../types.js'

export type Plugin<
  PluginContext extends Record<string, any> = {},
  TServerContext = {},
  TUserContext = {},
> = EnvelopPlugin<YogaInitialContext & PluginContext> & {
  /**
   * onExecute hook that is invoked before the execute function is invoked.
   */
  onExecute?: OnExecuteHook<YogaInitialContext & PluginContext & TUserContext>
  /**
   * onSubscribe hook that is invoked before the subscribe function is called.
   * Return a OnSubscribeHookResult for hooking into phase after the subscribe function has been called.
   */
  onSubscribe?: OnSubscribeHook<
    YogaInitialContext & PluginContext & TUserContext
  >
} & {
  /**
   * Use this hook with your own risk. It is still experimental and may change in the future.
   * @internal
   */
  onRequest?: OnRequestHook<TServerContext>
  /**
   * Use this hook with your own risk. It is still experimental and may change in the future.
   * @internal
   */
  onRequestParse?: OnRequestParseHook<TServerContext>
  /**
   * Use this hook with your own risk. It is still experimental and may change in the future.
   * @internal
   */
  onParams?: OnParamsHook
  /**
   * Use this hook with your own risk. It is still experimental and may change in the future.
   * @internal
   */
  onResultProcess?: OnResultProcess
  /**
   * Use this hook with your own risk. It is still experimental and may change in the future.
   * @internal
   */
  onResponse?: OnResponseHook<TServerContext>
}

export type OnRequestHook<TServerContext> = (
  payload: OnRequestEventPayload<TServerContext>,
) => PromiseOrValue<void>

export interface OnRequestEventPayload<TServerContext> {
  request: Request
  serverContext: TServerContext | undefined
  fetchAPI: FetchAPI
  endResponse(response: Response): void
  url: URL
}

export type OnRequestParseHook<TServerContext> = (
  payload: OnRequestParseEventPayload<TServerContext>,
) => PromiseOrValue<void | OnRequestParseHookResult>

export type RequestParser = (
  request: Request,
) => PromiseOrValue<GraphQLParams> | PromiseOrValue<GraphQLParams[]>

export interface OnRequestParseEventPayload<TServerContext> {
  request: Request
  requestParser: RequestParser | undefined
  serverContext: TServerContext
  setRequestParser: (parser: RequestParser) => void
}

export type OnRequestParseHookResult = {
  onRequestParseDone?: OnRequestParseDoneHook
}

export type OnRequestParseDoneHook = (
  payload: OnRequestParseDoneEventPayload,
) => PromiseOrValue<void>

export interface OnRequestParseDoneEventPayload {
  requestParserResult: GraphQLParams | GraphQLParams[]
  setRequestParserResult: (params: GraphQLParams | GraphQLParams[]) => void
}

export type OnParamsHook = (
  payload: OnParamsEventPayload,
) => PromiseOrValue<void>

export interface OnParamsEventPayload {
  params: GraphQLParams
  request: Request
  setParams: (params: GraphQLParams) => void
  setResult: (result: ExecutorResult) => void
  fetchAPI: FetchAPI
}

export type OnResultProcess = (
  payload: OnResultProcessEventPayload,
) => PromiseOrValue<void>

export type ExecutorResult =
  | ExecutionResult
  | AsyncIterable<ExecutionResult>
  | AsyncIterable<ExecutionPatchResult>

export type ResultProcessorInput =
  | MaybeArray<ExecutionResult>
  | AsyncIterable<ExecutionResult>
  | AsyncIterable<ExecutionPatchResult>

export type ResultProcessor = (
  result: ResultProcessorInput,
  fetchAPI: FetchAPI,
  acceptedMediaType: string,
) => PromiseOrValue<Response>

export interface OnResultProcessEventPayload {
  request: Request
  result: ResultProcessorInput
  resultProcessor?: ResultProcessor
  acceptableMediaTypes: Set<string>
  setResultProcessor(
    resultProcessor: ResultProcessor,
    acceptedMediaType: string,
  ): void
}

export type OnResponseHook<TServerContext> = (
  payload: OnResponseEventPayload<TServerContext>,
) => PromiseOrValue<void>

export interface OnResponseEventPayload<TServerContext> {
  request: Request
  serverContext: TServerContext | undefined
  response: Response
}
