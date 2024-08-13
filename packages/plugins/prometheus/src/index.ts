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
    /**
     * Tracks the duration of HTTP requests. It reports the time spent to
     * process each incoming request as an histogram.
     *
     * You can pass multiple type of values:
     *  - boolean: Disable or Enable the metric with default configuration
     *  - string: Enable the metric with custom name
     *  - number[]: Enable the metric with custom buckets
     *  - ReturnType<typeof createHistogram>: Enable the metric with custom configuration
     */
    graphql_yoga_http_duration?: boolean | string | number[] | ReturnType<typeof createHistogram>;
  };

  labels?: {
    /**
     * The HTTP method of the request
     */
    method?: boolean;
    /**
     * The status code of the response
     */
    statusCode?: boolean;
    /**
     * The url of the HTTP request
     */
    url?: boolean;
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
      labelNames: ['operationName', 'operationType', 'method', 'statusCode', 'url'],
    },
    (params, { request, response }) => ({
      method: request.method,
      statusCode: response.status,
      operationType: params.operationType || 'unknown',
      operationName: params.operationName || 'Anonymous',
      url: request.url,
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
        const duration = (Date.now() - start) / 1000;
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
