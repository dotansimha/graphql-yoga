import ApolloReportingProtobuf from 'apollo-reporting-protobuf';
import { GraphQLError, ResponsePath } from 'graphql';
import { createGraphQLError, isAsyncIterable, Plugin, YogaInitialContext } from 'graphql-yoga';
import { useOnResolve } from '@envelop/on-resolve';
import { btoa } from '@whatwg-node/fetch';

export interface ApolloInlineTraceContext {
  startHrTime: [number, number];
  rootNode: ApolloReportingProtobuf.Trace.Node;
  trace: ApolloReportingProtobuf.Trace;
  nodes: Map<string, ApolloReportingProtobuf.Trace.Node>;
  /**
   * graphql-js can continue to execute more fields indefinitely after
   * `execute()` resolves. That's because parallelism on a selection set
   * is implemented using `Promise.all`, and as soon as one field
   * throws an error, the combined Promise resolves, but there's no
   * "cancellation" of the rest of Promises/fields in `Promise.all`.
   */
  stopped: boolean;
}

export interface ApolloInlineTracePluginOptions {
  /**
   * Format errors before being sent for tracing. Beware that only the error
   * `message` and `extensions` can be changed.
   *
   * Return `null` to skip reporting error.
   */
  rewriteError?: (err: GraphQLError) => GraphQLError | null;
  /**
   * Allows to entirely disable tracing based on the HTTP request
   * @param request HTTP request from the execution context
   * @returns If true is returned (either as is or wrapped in Promise), traces for this request will
   *          not be generated.
   */
  ignoreRequest?: (request: Request) => Promise<boolean> | boolean;
}

const asArray = <T>(x: T | T[]): T[] => (Array.isArray(x) ? x : [x]);

/**
 * Produces Apollo's base64 trace protocol containing timing, resolution and
 * errors information.
 *
 * The output is placed in `extensions.ftv1` of the GraphQL result.
 *
 * The Apollo Gateway utilizes this data to construct the full trace and submit
 * it to Apollo's usage reporting ingress.
 */
export function useApolloInlineTrace(
  options: ApolloInlineTracePluginOptions = {},
): Plugin<YogaInitialContext> {
  const [instrumentation, ctxForReq] = useApolloInstrumentation({
    ignoreRequest: request => request.headers.get('apollo-federation-include-trace') !== 'ftv1',
    ...options,
  });

  return {
    onPluginInit({ addPlugin }) {
      addPlugin(instrumentation);
      addPlugin({
        onResultProcess({ request, result }) {
          const ctx = ctxForReq.get(request);
          if (!ctx) return;

          // TODO: should handle streaming results? how?
          if (isAsyncIterable(result)) return;

          for (const singleResult of asArray(result)) {
            // TODO: Probably broken in batched queries

            if (singleResult.extensions?.ftv1 !== undefined) {
              throw new Error('The `ftv1` extension is already present');
            }

            const encodedUint8Array = ApolloReportingProtobuf.Trace.encode(ctx.trace).finish();
            const base64 = btoa(String.fromCharCode(...encodedUint8Array));

            singleResult.extensions = {
              ...singleResult.extensions,
              ftv1: base64,
            };
          }
        },
      });
    },
  };
}

/**
 * Instrument GraphQL request processing pipeline and creates Apollo compatible tracing data.
 *
 * This is meant as a helper, do not use it directly. Use `useApolloInlineTrace` or `useApolloUsageReport` instead.
 * @param options
 * @returns A tuple with the instrumentation plugin and a WeakMap containing the tracing data
 */
export function useApolloInstrumentation(options: ApolloInlineTracePluginOptions) {
  const ctxForReq = new WeakMap<Request, ApolloInlineTraceContext>();

  const plugin: Plugin = {
    onPluginInit: ({ addPlugin }) => {
      addPlugin(
        useOnResolve(({ context: { request }, info }) => {
          const ctx = ctxForReq.get(request);
          if (!ctx) return;

          // result was already shipped (see ApolloInlineTraceContext.stopped)
          if (ctx.stopped) {
            return () => {
              // noop
            };
          }

          const node = newTraceNode(ctx, info.path);
          node.type = info.returnType.toString();
          node.parentType = info.parentType.toString();
          node.startTime = hrTimeToDurationInNanos(process.hrtime(ctx.startHrTime));
          if (typeof info.path.key === 'string' && info.path.key !== info.fieldName) {
            // field was aliased, send the original field name too
            node.originalFieldName = info.fieldName;
          }

          return () => {
            node.endTime = hrTimeToDurationInNanos(process.hrtime(ctx.startHrTime));
          };
        }),
      );
    },
    async onRequest({ request }) {
      // must be ftv1 tracing protocol
      if (await options.ignoreRequest?.(request)) {
        return;
      }

      const startHrTime = process.hrtime();
      const rootNode = new ApolloReportingProtobuf.Trace.Node();
      ctxForReq.set(request, {
        startHrTime,
        rootNode,
        trace: new ApolloReportingProtobuf.Trace({
          root: rootNode,
          fieldExecutionWeight: 1, // Why 1? See: https://github.com/apollographql/apollo-server/blob/9389da785567a56e989430962564afc71e93bd7f/packages/apollo-server-core/src/plugin/traceTreeBuilder.ts#L16-L23
          startTime: nowTimestamp(),
        }),
        nodes: new Map([[responsePathToString(), rootNode]]),
        stopped: false,
      });
    },
    onParse() {
      return ({ context: { request }, result }) => {
        const ctx = ctxForReq.get(request);
        if (!ctx) return;

        if (result instanceof GraphQLError) {
          handleErrors(ctx, [result], options.rewriteError);
        } else if (result instanceof Error) {
          handleErrors(
            ctx,
            [
              createGraphQLError(result.message, {
                originalError: result,
              }),
            ],
            options.rewriteError,
          );
        }
      };
    },
    onValidate() {
      return ({ context: { request }, result: errors }) => {
        if (errors.length) {
          const ctx = ctxForReq.get(request);
          if (ctx)
            // Envelop doesn't give GraphQLError type since it is agnostic
            handleErrors(ctx, errors as GraphQLError[], options.rewriteError);
        }
      };
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
            const ctx = ctxForReq.get(request);
            if (ctx) handleErrors(ctx, result.errors, options.rewriteError);
          }
        },
      };
    },
    onResultProcess({ request, result }) {
      const ctx = ctxForReq.get(request);
      if (!ctx) return;

      // TODO: should handle streaming results? how?
      if (isAsyncIterable(result)) return;

      // onResultProcess will be called only once since we disallow async iterables
      if (ctx.stopped) throw new Error('Trace stopped multiple times');
      ctx.stopped = true;
      ctx.trace.durationNs = hrTimeToDurationInNanos(process.hrtime(ctx.startHrTime));
      ctx.trace.endTime = nowTimestamp();
    },
  };

  return [plugin, ctxForReq] as const;
}

/**
 * Converts an hrtime array (as returned from process.hrtime) to nanoseconds.
 *
 * The entire point of the hrtime data structure is that the JavaScript Number
 * type can't represent all int64 values without loss of precision.
 *
 * Reference: https://github.com/apollographql/apollo-server/blob/9389da785567a56e989430962564afc71e93bd7f/packages/apollo-server-core/src/plugin/traceTreeBuilder.ts#L269-L285
 */
function hrTimeToDurationInNanos(hrtime: [number, number]) {
  return hrtime[0] * 1e9 + hrtime[1];
}

/**
 * Current time from Date.now() as a google.protobuf.Timestamp.
 *
 * Reference: https://github.com/apollographql/apollo-server/blob/9389da785567a56e989430962564afc71e93bd7f/packages/apollo-server-core/src/plugin/traceTreeBuilder.ts#L315-L323
 */
function nowTimestamp(): ApolloReportingProtobuf.google.protobuf.Timestamp {
  const totalMillis = Date.now();
  const millis = totalMillis % 1000;
  return new ApolloReportingProtobuf.google.protobuf.Timestamp({
    seconds: (totalMillis - millis) / 1000,
    nanos: millis * 1e6,
  });
}

/**
 * Convert from the linked-list ResponsePath format to a dot-joined
 * string. Includes the full path (field names and array indices).
 *
 * Reference: https://github.com/apollographql/apollo-server/blob/9389da785567a56e989430962564afc71e93bd7f/packages/apollo-server-core/src/plugin/traceTreeBuilder.ts#L287-L303
 */
function responsePathToString(path?: ResponsePath): string {
  if (path === undefined) {
    return '';
  }

  // `responsePathAsArray` from `graphql-js/execution` created new arrays unnecessarily
  let res = String(path.key);

  while ((path = path.prev) !== undefined) {
    res = `${path.key}.${res}`;
  }

  return res;
}

function ensureParentTraceNode(
  ctx: ApolloInlineTraceContext,
  path: ResponsePath,
): ApolloReportingProtobuf.Trace.Node {
  const parentNode = ctx.nodes.get(responsePathToString(path.prev));
  if (parentNode) return parentNode;
  // path.prev isn't undefined because we set up the root path in ctx.nodes
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return newTraceNode(ctx, path.prev!);
}

function newTraceNode(ctx: ApolloInlineTraceContext, path: ResponsePath) {
  const node = new ApolloReportingProtobuf.Trace.Node();
  const id = path.key;
  if (typeof id === 'number') {
    node.index = id;
  } else {
    node.responseName = id;
  }
  ctx.nodes.set(responsePathToString(path), node);
  const parentNode = ensureParentTraceNode(ctx, path);
  parentNode.child.push(node);
  return node;
}

function handleErrors(
  ctx: ApolloInlineTraceContext,
  errors: readonly GraphQLError[],
  rewriteError: ApolloInlineTracePluginOptions['rewriteError'],
) {
  if (ctx.stopped) {
    throw new Error('Handling errors after tracing was stopped');
  }

  for (const err of errors) {
    /**
     * This is an error from a federated service. We will already be reporting
     * it in the nested Trace in the query plan.
     *
     * Reference: https://github.com/apollographql/apollo-server/blob/9389da785567a56e989430962564afc71e93bd7f/packages/apollo-server-core/src/plugin/traceTreeBuilder.ts#L133-L141
     */
    if (err.extensions?.serviceName) {
      continue;
    }

    let errToReport = err;

    // errors can be rewritten through `rewriteError`
    if (rewriteError) {
      // clone error to avoid users mutating the original one
      const clonedErr = Object.assign(Object.create(Object.getPrototypeOf(err)), err);
      const rewrittenError = rewriteError(clonedErr);
      if (!rewrittenError) {
        // return nullish to skip reporting
        continue;
      }
      errToReport = rewrittenError;
    }

    // only message and extensions can be rewritten
    errToReport = createGraphQLError(errToReport.message, {
      extensions: errToReport.extensions || err.extensions,
      nodes: err.nodes,
      source: err.source,
      positions: err.positions,
      path: err.path,
      originalError: err.originalError,
    });

    // put errors on the root node by default
    let node = ctx.rootNode;

    if (Array.isArray(errToReport.path)) {
      const specificNode = ctx.nodes.get(errToReport.path.join('.'));
      if (specificNode) {
        node = specificNode;
      } else {
        throw new Error(`Could not find node with path ${errToReport.path.join('.')}`);
      }
    }

    node.error.push(
      new ApolloReportingProtobuf.Trace.Error({
        message: errToReport.message,
        location: (errToReport.locations || []).map(
          ({ line, column }) => new ApolloReportingProtobuf.Trace.Location({ line, column }),
        ),
        json: JSON.stringify(errToReport),
      }),
    );
  }
}
