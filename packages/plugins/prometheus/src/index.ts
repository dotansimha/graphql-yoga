import {
  PrometheusTracingPluginConfig as EnvelopPrometheusTracingPluginConfig,
  usePrometheus as useEnvelopPrometheus,
  createCounter,
  createHistogram,
  createSummary,
  FillLabelsFnParams,
} from '@envelop/prometheus'
import { getOperationAST } from 'graphql'
import { Plugin } from 'graphql-yoga'
import { Histogram, register as defaultRegistry } from 'prom-client'

export { createCounter, createHistogram, createSummary, FillLabelsFnParams }

export interface PrometheusTracingPluginConfig
  extends EnvelopPrometheusTracingPluginConfig {
  http?: boolean | ReturnType<typeof createHistogram>
  httpRequestHeaders?: boolean
  httpResponseHeaders?: boolean
  /**
   * The endpoint to serve metrics exposed by this plugin.
   * Defaults to "/metrics".
   */
  endpoint?: string
}

export function usePrometheus(options: PrometheusTracingPluginConfig): Plugin {
  const endpoint = options.endpoint || '/metrics'
  const registry = options.registry || defaultRegistry

  let httpHistogram: ReturnType<typeof createHistogram> | undefined

  if (options.http) {
    const labelNames = [
      'url',
      'method',
      'statusCode',
      'statusText',
      'operationName',
      'operationType',
    ]
    if (options.httpRequestHeaders) {
      labelNames.push('requestHeaders')
    }
    if (options.httpResponseHeaders) {
      labelNames.push('responseHeaders')
    }
    httpHistogram =
      typeof options.http === 'object'
        ? options.http
        : createHistogram({
            histogram: new Histogram({
              name: 'graphql_yoga_http_duration',
              help: 'Time spent on HTTP connection',
              labelNames,
              registers: [registry],
            }),
            fillLabelsFn(params, { request, response }) {
              const labels: Record<string, string> = {
                operationName: params.operationName || 'Anonymous',
                url: request.url,
                method: request.method,
                statusCode: response.status,
                statusText: response.statusText,
              }
              if (params?.operationType) {
                labels.operationType = params.operationType
              }
              if (options.httpRequestHeaders) {
                labels.requestHeaders = JSON.stringify(
                  Object.fromEntries(request.headers.entries()),
                )
              }
              if (options.httpResponseHeaders) {
                labels.responseHeaders = JSON.stringify(
                  Object.fromEntries(response.headers.entries()),
                )
              }
              return labels
            },
          })
  }

  const startByRequest = new WeakMap<Request, number>()
  const paramsByRequest = new WeakMap<Request, FillLabelsFnParams>()

  return {
    onPluginInit({ addPlugin }) {
      addPlugin(useEnvelopPrometheus({ ...options, registry }) as Plugin)
    },
    async onRequest({ request, url, fetchAPI, endResponse }) {
      startByRequest.set(request, Date.now())
      if (url.pathname === endpoint) {
        const metrics = await registry.metrics()
        const response = new fetchAPI.Response(metrics, {
          headers: {
            'Content-Type': registry.contentType,
          },
        })
        endResponse(response)
      }
    },
    onExecute({ args }) {
      const operationAST = getOperationAST(args.document, args.operationName)
      const operationType = operationAST?.operation
      const operationName = operationAST?.name?.value
      paramsByRequest.set(args.contextValue.request, {
        document: args.document,
        operationName,
        operationType,
      })
    },
    onResponse({ request, response, serverContext }) {
      const start = startByRequest.get(request)
      if (start) {
        const duration = Date.now() - start
        const params = paramsByRequest.get(request)
        httpHistogram?.histogram.observe(
          httpHistogram.fillLabelsFn(params || {}, {
            ...serverContext,
            request,
            response,
          }),
          duration,
        )
      }
    },
  }
}
