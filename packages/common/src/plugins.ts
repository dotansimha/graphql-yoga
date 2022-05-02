import { Plugin as EnvelopPlugin, PromiseOrValue } from '@envelop/core'
import { GraphQLParams } from './types'

export type Plugin<
  PluginContext extends Record<string, any> = {},
  TServerContext = {},
> = EnvelopPlugin<PluginContext> & {
  onRequestParse?: OnRequestParseHook<TServerContext>
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
