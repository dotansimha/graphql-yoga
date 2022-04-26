import { Plugin as EnvelopPlugin, PromiseOrValue } from '@envelop/core'
import { RequestParser } from './getGraphQLParameters'
import { GraphQLParams } from './types'

export type Plugin<PluginContext extends Record<string, any> = {}> =
  EnvelopPlugin<PluginContext> & {
    onRequestParse?: OnRequestParseHook
  }

export type OnRequestParseHook = (
  payload: OnRequestParseEventPayload,
) => PromiseOrValue<void | OnRequestParseHookResult>

export interface OnRequestParseEventPayload {
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
  setGraphQLParams: (params: GraphQLParams) => void
}
