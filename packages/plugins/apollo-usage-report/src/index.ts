import { defaultUsageReportingSignature } from 'apollo-graphql';
import { Report } from 'apollo-reporting-protobuf';
import { printSchema } from 'graphql';
import { isAsyncIterable, Plugin, YogaLogger } from 'graphql-yoga';
import {
  ApolloInlineTraceContext,
  ApolloInlineTracePluginOptions,
  useApolloInstrumentation,
} from '@graphql-yoga/plugin-apollo-inline-trace';
import { fetch } from '@whatwg-node/fetch';

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

const DEFAULT_REPORTING_ENDPOINT =
  'https://usage-reporting.api.apollographql.com/api/ingress/traces';

export function useApolloUsageReport(options: ApolloUsageReportOptions = {}): Plugin {
  const [instrumentation, ctxForReq] = useApolloInstrumentation(options) as [
    Plugin,
    WeakMap<
      Request,
      ApolloInlineTraceContext & {
        schemaId?: string;
        operationKey?: string;
      }
    >,
  ];

  const {
    graphRef = process.env['APOLLO_GRAPH_REF'],
    apiKey = process.env['APOLLO_KEY'],
    endpoint = DEFAULT_REPORTING_ENDPOINT,
  } = options;

  let logger: YogaLogger;
  let schemaId: string;

  return {
    onPluginInit({ addPlugin }) {
      addPlugin(instrumentation);
      addPlugin({
        async onYogaInit(args) {
          logger = Object.fromEntries(
            Object.entries(args.yoga.logger).map(([level, log]) => [
              level,
              (...args: unknown[]) => log('[ApolloUsageReport]', ...args),
            ]),
          ) as YogaLogger;

          if (!apiKey) {
            throw new Error(
              `[ApolloUsageReport] Missing API key. Please provide one in plugin options or with 'APOLLO_KEY' environment variable.`,
            );
          }

          if (!graphRef) {
            throw new Error(
              `[ApolloUsageReport] Missing Graph Ref. Please provide one in plugin options or with 'APOLLO_GRAPH_REF' environment variable.`,
            );
          }

          logger.debug('using', { apiKey, graphRef });
        },
        async onSchemaChange({ schema }) {
          if (schema) {
            schemaId = await hashSHA256(printSchema(schema));
          }
        },
        onParse() {
          return ({ result, context: { request, params } }) => {
            const ctx = ctxForReq.get(request);
            if (!ctx) {
              logger.debug('ctx not found during parsing');
              return;
            }

            const { operationName } = params;
            const signature = defaultUsageReportingSignature(result, operationName || '');
            ctx.operationKey = `# ${operationName || '-'}\n${signature}`;
            ctx.schemaId = schemaId;
          };
        },

        async onResultProcess(args) {
          const ctx = ctxForReq.get(args.request);
          if (!ctx?.operationKey || !ctx?.schemaId) {
            logger.debug('ctx not found during result processing:', ctx);
            return;
          }

          // TODO: Handle async iterables ?
          if (isAsyncIterable(args.result)) {
            logger.debug('async iterable results not implemented for now');
            return;
          }

          fetch(endpoint, {
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
                executableSchemaId: ctx.schemaId,
              },
              operationCount: 1,
              tracesPerQuery: {
                [ctx.operationKey]: {
                  trace: [ctx.trace],
                },
              },
            }).finish(),
          }).then(async response => {
            if (response.ok) {
              logger.debug('Traces sent:', await response.text());
            } else {
              logger.error('Failed to send trace:', await response.text());
            }
          });
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
