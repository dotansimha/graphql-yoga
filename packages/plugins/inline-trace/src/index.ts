import { isAsyncIterable, Plugin, YogaInitialContext } from 'graphql-yoga'
import { GraphQLError } from 'graphql'
import { TraceTreeBuilder } from './apolloTraceTreeBuilder'
import { Trace } from 'apollo-reporting-protobuf'

export interface InlineTracePluginOptions {
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
export function useInlineTrace(
  options: InlineTracePluginOptions = {},
): Plugin<YogaInitialContext> {
  interface Context {
    treeBuilder: TraceTreeBuilder
  }

  const ctxForReq = new WeakMap<Request, Context>()

  return {
    onRequest({ request }) {
      // must be ftv1 tracing protocol
      if (request.headers.get('apollo-federation-include-trace') !== 'ftv1') {
        return
      }

      const treeBuilder = new TraceTreeBuilder({
        rewriteError: options.rewriteError,
      })

      treeBuilder.startTiming()

      ctxForReq.set(request, { treeBuilder })
    },
    onResolverCalled({ context: { request }, info }) {
      return ctxForReq.get(request)?.treeBuilder.willResolveField(info)
    },
    onParse() {
      return ({ context: { request }, result }) => {
        if (result instanceof GraphQLError) {
          ctxForReq.get(request)?.treeBuilder.didEncounterErrors([result])
        } else if (result instanceof Error) {
          ctxForReq.get(request)?.treeBuilder.didEncounterErrors([
            new GraphQLError(result.message, {
              originalError: result,
            }),
          ])
        }
      }
    },
    onValidate() {
      return ({ context: { request }, result: errors }) => {
        if (errors.length) {
          ctxForReq.get(request)?.treeBuilder.didEncounterErrors(errors)
        }
      }
    },
    onExecute() {
      return {
        onExecuteDone({
          args: {
            contextValue: { request },
          },
          result,
        }) {
          // TODO: should handle streaming results? how?
          if (!isAsyncIterable(result) && result.errors?.length) {
            ctxForReq
              .get(request)
              ?.treeBuilder.didEncounterErrors(result.errors)
          }
        },
      }
    },
    // TODO: should track subscription errors? how?
    onResultProcess({ request, result }) {
      const treeBuilder = ctxForReq.get(request)?.treeBuilder
      if (!treeBuilder) return

      // TODO: should handle streaming results? how?
      if (isAsyncIterable(result)) return

      treeBuilder.stopTiming()

      const encodedUint8Array = Trace.encode(treeBuilder.trace).finish()
      const encodedBuffer = Buffer.from(
        encodedUint8Array,
        encodedUint8Array.byteOffset,
        encodedUint8Array.byteLength,
      )

      const extensions =
        result.extensions || (result.extensions = Object.create(null))

      if (typeof extensions.ftv1 !== 'undefined') {
        throw new Error('The `ftv1` extension was already present.')
      }

      extensions.ftv1 = encodedBuffer.toString('base64')
    },
  }
}
