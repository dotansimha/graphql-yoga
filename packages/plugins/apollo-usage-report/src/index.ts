import { defaultUsageReportingSignature } from 'apollo-graphql';
import { Report } from 'apollo-reporting-protobuf';
import { printSchema } from 'graphql';
import {
  isAsyncIterable,
  Plugin,
  YogaInitialContext,
  YogaLogger,
  type FetchAPI,
} from 'graphql-yoga';
import {
  ApolloInlineGraphqlTraceContext,
  ApolloInlineRequestTraceContext,
  ApolloInlineTracePluginOptions,
  useApolloInstrumentation,
} from '@graphql-yoga/plugin-apollo-inline-trace';

type ApolloUsageReportOptions = ApolloInlineTracePluginOptions & {
  /**
   * The graph ref of the managed federation graph.
   * It is composed of the graph ID and the variant (`<YOUR_GRAPH_ID>@<VARIANT>`).
   *
   * If not provided, `APOLLO_GRAPH_REF` environment variable is used.
   *
   * You can find a a graph's ref at the top of its Schema Reference page in Apollo Studio.
   */
  graphRef?: string;
  /**
   * The API key to use to authenticate with the managed federation up link.
   * It needs at least the `service:read` permission.
   *
   * If not provided, `APOLLO_KEY` environment variable will be used instead.
   *
   * [Learn how to create an API key](https://www.apollographql.com/docs/federation/v1/managed-federation/setup#4-connect-the-gateway-to-studio)
   */
  apiKey?: string;
  /**
   * Usage report endpoint
   *
   * Defaults to GraphOS endpoint (https://usage-reporting.api.apollographql.com/api/ingress/traces)
   */
  endpoint?: string;
};

export interface ApolloUsageReportRequestContext extends ApolloInlineRequestTraceContext {
  traces: Map<YogaInitialContext, ApolloUsageReportGraphqlContext>;
}

export interface ApolloUsageReportGraphqlContext extends ApolloInlineGraphqlTraceContext {
  operationKey?: string;
  schemaId?: string;
}

const DEFAULT_REPORTING_ENDPOINT =
  'https://usage-reporting.api.apollographql.com/api/ingress/traces';

export function useApolloUsageReport(options: ApolloUsageReportOptions = {}): Plugin {
  const [instrumentation, ctxForReq] = useApolloInstrumentation(options) as [
    Plugin,
    WeakMap<Request, ApolloUsageReportRequestContext>,
  ];

  let logger: YogaLogger;
  let fetchAPI: FetchAPI;
  let schemaId: string;

  return {
    onPluginInit({ addPlugin }) {
      addPlugin(instrumentation);
      addPlugin({
        onYogaInit(args) {
          fetchAPI = args.yoga.fetchAPI;
          logger = Object.fromEntries(
            (['error', 'warn', 'info', 'debug'] as const).map(level => [
              level,
              (...messages: unknown[]) =>
                args.yoga.logger[level]('[ApolloUsageReport]', ...messages),
            ]),
          ) as YogaLogger;

          if (!options.apiKey && !process.env['APOLLO_KEY']) {
            throw new Error(
              `[ApolloUsageReport] Missing API key. Please provide one in plugin options or with 'APOLLO_KEY' environment variable.`,
            );
          }

          if (!options.graphRef && !process.env['APOLLO_GRAPH_REF']) {
            throw new Error(
              `[ApolloUsageReport] Missing Graph Ref. Please provide one in plugin options or with 'APOLLO_GRAPH_REF' environment variable.`,
            );
          }
        },
        async onSchemaChange({ schema }) {
          if (schema) {
            schemaId = await hashSHA256(printSchema(schema));
          }
        },
        onParse() {
          return ({ result, context }) => {
            const ctx = ctxForReq.get(context.request)?.traces.get(context);
            if (!ctx) {
              logger.debug(
                'operation tracing context not found, this operation will not be traced.',
              );
              return;
            }

            const { operationName } = context.params;
            const signature = defaultUsageReportingSignature(result, operationName || '');
            ctx.operationKey = `# ${operationName || '-'}\n${signature}`;
            ctx.schemaId = schemaId;
          };
        },

        onResultProcess(args) {
          // TODO: Handle async iterables ?
          if (isAsyncIterable(args.result)) {
            logger.debug('async iterable results not implemented for now');
            return;
          }

          const reqCtx = ctxForReq.get(args.request);
          if (!reqCtx) {
            logger.debug('operation tracing context not found, this operation will not be traced.');
            return;
          }

          // Each operation in a batched request can belongs to a different schema.
          // Apollo doesn't allow to send batch queries for multiple schemas in the same batch
          const tracesPerSchema: Record<string, Report['tracesPerQuery']> = {};
          for (const trace of reqCtx.traces.values()) {
            if (!trace.schemaId || !trace.operationKey) {
              throw new TypeError('Misformed trace, missing operation key or schema id');
            }
            tracesPerSchema[trace.schemaId] ||= {};
            tracesPerSchema[trace.schemaId][trace.operationKey] ||= { trace: [] };
            tracesPerSchema[trace.schemaId][trace.operationKey].trace?.push(trace.trace);
          }

          const tracesPromises = Object.entries(tracesPerSchema).map(([schemaId, tracesPerQuery]) =>
            sendTrace(options, logger, fetchAPI, schemaId, tracesPerQuery),
          );

          args.serverContext.waitUntil(Promise.all(tracesPromises));
        },
      });
    },
  };
}

export async function hashSHA256(
  str: string,
  api: {
    crypto: Crypto;
    TextEncoder: (typeof globalThis)['TextEncoder'];
  } = globalThis,
) {
  const { crypto, TextEncoder } = api;
  const textEncoder = new TextEncoder();
  const utf8 = textEncoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
  let hashHex = '';
  for (const bytes of new Uint8Array(hashBuffer)) {
    hashHex += bytes.toString(16).padStart(2, '0');
  }
  return hashHex;
}

async function sendTrace(
  options: ApolloUsageReportOptions,
  logger: YogaLogger,
  { fetch }: FetchAPI,
  schemaId: string,
  tracesPerQuery: Report['tracesPerQuery'],
) {
  const {
    graphRef = process.env['APOLLO_GRAPH_REF'],
    apiKey = process.env['APOLLO_KEY'],
    endpoint = DEFAULT_REPORTING_ENDPOINT,
  } = options;

  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/protobuf',
      // The presence of the api key is already checked at Yoga initialization time
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      'x-api-key': apiKey!,
      accept: 'application/json',
    },
    body: Report.encode({
      header: {
        graphRef,
        executableSchemaId: schemaId,
      },
      operationCount: 1,
      tracesPerQuery,
    }).finish(),
  })
    .then(async response => {
      if (response.ok) {
        logger.debug('Traces sent:', await response.text());
      } else {
        logger.error('Failed to send trace:', await response.text());
      }
    })
    .catch(err => {
      logger.error('Failed to send trace:', err);
    });
}
