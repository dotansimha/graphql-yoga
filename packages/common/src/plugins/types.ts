import { Plugin as EnvelopPlugin, PromiseOrValue } from '@envelop/core'
import { ExecutionResult } from 'graphql'
import {
  ExecutionPatchResult,
  FetchAPI,
  GraphQLParams,
  YogaInitialContext,
} from '../types'

export type Plugin<
  PluginContext extends Record<string, any> = {},
  TServerContext = {},
  TUserContext = {},
> = EnvelopPlugin<PluginContext> & {
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
  onResultProcess?: OnResultProcess<
    TServerContext & TUserContext & YogaInitialContext
  >
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
}

export type OnRequestParseHook<TServerContext> = (
  payload: OnRequestParseEventPayload<TServerContext>,
) => PromiseOrValue<void | OnRequestParseHookResult>

export type RequestParser = (request: Request) => PromiseOrValue<GraphQLParams>

export interface OnRequestParseEventPayload<TServerContext> {
  serverContext: TServerContext | undefined
  request: Request
  requestParser: RequestParser
  setRequestParser: (parser: RequestParser) => void
}

export type OnRequestParseHookResult = {
  onRequestParseDone?: OnRequestParseDoneHook
}

export type OnRequestParseDoneHook = (
  payload: OnRequestParseDoneEventPayload,
) => PromiseOrValue<void>

export interface OnRequestParseDoneEventPayload {
  params: GraphQLParams
  setParams: (params: GraphQLParams) => void
}

export type OnResultProcess<TContext> = (
  payload: OnResultProcessEventPayload<TContext>,
) => PromiseOrValue<void>

export type ResultProcessorInput = PromiseOrValue<
  ExecutionResult | AsyncIterable<ExecutionResult | ExecutionPatchResult>
>

export type ResultProcessor = (
  result: ResultProcessorInput,
  fetchAPI: FetchAPI,
) => PromiseOrValue<Response>

export interface OnResultProcessEventPayload<TContext> {
  request: Request
  context: TContext
  result: ResultProcessorInput
  resultProcessor: ResultProcessor
  setResultProcessor(resultProcessor: ResultProcessor): void
}

export type OnResponseHook<TServerContext> = (
  payload: OnResponseEventPayload<TServerContext>,
) => PromiseOrValue<void>

export interface OnResponseEventPayload<TServerContext> {
  request: Request
  serverContext: TServerContext | undefined
  response: Response
}
