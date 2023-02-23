/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  OnExecuteHook,
  OnSubscribeHook,
  Plugin as EnvelopPlugin,
  PromiseOrValue,
} from '@envelop/core'
import { ExecutionResult } from '@graphql-tools/utils'
import { ServerAdapterPlugin } from '@whatwg-node/server'

import { YogaServer } from '../server.js'
import {
  FetchAPI,
  GraphQLHTTPExtensions,
  GraphQLParams,
  MaybeArray,
  YogaInitialContext,
} from '../types.js'

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
    onYogaInit?: OnYogaInitHook<TServerContext>
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
  }

export type OnYogaInitHook<TServerContext extends Record<string, any>> = (
  payload: OnYogaInitEventPayload<TServerContext>,
) => void

export type OnYogaInitEventPayload<TServerContext extends Record<string, any>> =
  {
    yoga: YogaServer<TServerContext, any>
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
  url: URL
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
  setResult: (result: ExecutionResult) => void
  fetchAPI: FetchAPI
}

export type OnResultProcess = (
  payload: OnResultProcessEventPayload,
) => PromiseOrValue<void>

export type ResultProcessorInput =
  | MaybeArray<ExecutionResult>
  | AsyncIterable<ExecutionResult<any, { http?: GraphQLHTTPExtensions }>>

export type ResultProcessor = (
  result: ResultProcessorInput,
  fetchAPI: FetchAPI,
  acceptedMediaType: string,
) => PromiseOrValue<Response>

export interface OnResultProcessEventPayload {
  request: Request
  result: ResultProcessorInput
  setResult(result: ResultProcessorInput): void
  resultProcessor?: ResultProcessor
  acceptableMediaTypes: string[]
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
