import { getOperationAST } from 'graphql';
import { Plugin } from 'graphql-yoga';
import { register as defaultRegistry } from 'prom-client';
import {
  CounterAndLabels,
  createCounter,
  createHistogram,
  createSummary,
  PrometheusTracingPluginConfig as EnvelopPrometheusTracingPluginConfig,
  FillLabelsFnParams,
  getCounterFromConfig,
  getHistogramFromConfig,
  getSummaryFromConfig,
  HistogramAndLabels,
  SummaryAndLabels,
  usePrometheus as useEnvelopPrometheus,
} from '@envelop/prometheus';

export {
  CounterAndLabels,
  createCounter,
  createHistogram,
  createSummary,
  FillLabelsFnParams,
  HistogramAndLabels,
  SummaryAndLabels,
  getHistogramFromConfig,
  getCounterFromConfig,
  getSummaryFromConfig,
};

export type PrometheusTracingPluginConfig = EnvelopPrometheusTracingPluginConfig & {
  metrics: {
    graphql_yoga_http_duration?: boolean | string | ReturnType<typeof createHistogram>;
  };

  /**
   * The endpoint to serve metrics exposed by this plugin.
   * Defaults to "/metrics".
   */
  endpoint?: string | boolean;
};

export function usePrometheus(options: PrometheusTracingPluginConfig): Plugin {
  const endpoint = options.endpoint || '/metrics';
  const registry = options.registry || defaultRegistry;

  const httpHistogram = getHistogramFromConfig<PrometheusTracingPluginConfig['metrics']>(
    options,
    'graphql_yoga_http_duration',
    {
      help: 'Time spent on HTTP connection',
      labelNames: ['operationName', 'operationType', 'method', 'statusCode'],
    },
    (params, { request, response }) => ({
      method: request.method,
      statusCode: response.status,
      operationType: params.operationType || 'unknown',
      operationName: params.operationName || 'Anonymous',
    }),
  );

  const startByRequest = new WeakMap<Request, number>();
  const paramsByRequest = new WeakMap<Request, FillLabelsFnParams>();

  return {
    onPluginInit({ addPlugin }) {
      addPlugin(useEnvelopPrometheus({ ...options, registry }) as Plugin);
    },
    onRequest({ request, url, fetchAPI, endResponse }) {
      startByRequest.set(request, Date.now());
      if (endpoint && url.pathname === endpoint) {
        return registry.metrics().then(metrics => {
          endResponse(
            new fetchAPI.Response(metrics, {
              headers: {
                'Content-Type': registry.contentType,
              },
            }),
          );
        });
      }
      return undefined;
    },
    onParse() {
      return ({ result: document, context: { params, request } }) => {
        const operationAST = getOperationAST(document, params.operationName);
        paramsByRequest.set(request, {
          document,
          operationName: operationAST?.name?.value,
          operationType: operationAST?.operation,
        });
      };
    },
    onResponse({ request, response, serverContext }) {
      const start = startByRequest.get(request);
      if (start) {
        const duration = Date.now() - start;
        const params = paramsByRequest.get(request);
        httpHistogram?.histogram.observe(
          httpHistogram.fillLabelsFn(params || {}, {
            ...serverContext,
            request,
            response,
          }),
          duration,
        );
      }
    },
  };
}
