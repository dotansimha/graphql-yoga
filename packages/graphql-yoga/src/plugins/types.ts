import { Plugin as EnvelopPlugin, PromiseOrValue } from '@envelop/core'
import { ExecutionResult } from 'graphql'
import { ExecutionPatchResult, FetchAPI, GraphQLParams } from '../types.js'

export type OperationResult =
  | ExecutionResult
  | AsyncIterable<ExecutionResult>
  | AsyncIterable<ExecutionPatchResult>

export type Plugin<
  PluginContext extends Record<string, any> = {},
  TServerContext = {},
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
  onRequestParse?: OnRequestParseHook
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

export type OnRequestParseHook = (
  payload: OnRequestParseEventPayload,
) => PromiseOrValue<void | OnRequestParseHookResult>

export type RequestParser = (request: Request) => PromiseOrValue<GraphQLParams>

export interface OnRequestParseEventPayload {
  request: Request
  requestParser: RequestParser | undefined
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
  setResult: (result: OperationResult) => void
}

export type OnResponseHook<TServerContext> = (
  payload: OnResponseEventPayload<TServerContext>,
) => PromiseOrValue<void>

export interface OnResponseEventPayload<TServerContext> {
  request: Request
  serverContext: TServerContext | undefined
  response: Response
}
