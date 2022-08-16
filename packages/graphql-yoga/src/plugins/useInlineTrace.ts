import { Plugin } from './types.js'
import { PromiseOrValue } from '@envelop/core'
import { GraphQLParams } from '../types.js'
import { GraphQLError } from 'graphql'

interface InlineTracePluginOptions {
  /**
   * > By default, all errors from this service get included in the trace.  You
   * > can specify a filter function to exclude specific errors from being
   * > reported by returning an explicit `null`, or you can mask certain details
   * > of the error by modifying it and returning the modified error.
   *
   * https://github.com/apollographql/apollo-server/blob/main/packages/apollo-server-core/src/plugin/inlineTrace/index.ts
   */
  rewriteError?: (err: GraphQLError) => GraphQLError | null
}

/**
 * > This ftv1 plugin produces a base64'd Trace protobuf containing only the
 * > durationNs, startTime, endTime, and root fields.  This output is placed
 * > on the `extensions`.`ftv1` property of the response.  The Apollo Gateway
 * > utilizes this data to construct the full trace and submit it to Apollo's
 * > usage reporting ingress.
 *
 * https://github.com/apollographql/apollo-server/blob/main/packages/apollo-server-core/src/plugin/inlineTrace/index.ts
 */
export function useInlineTrace(options: InlineTracePluginOptions): Plugin {
  return {
    onRequest() {},
    onResponse({ response }) {
      response
    },
  }
}
