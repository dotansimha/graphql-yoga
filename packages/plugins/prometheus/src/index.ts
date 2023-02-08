import {
  PrometheusTracingPluginConfig as EnvelopPrometheusTracingPluginConfig,
  usePrometheus as useEnvelopPrometheus,
  createCounter,
  createHistogram,
  createSummary,
  FillLabelsFnParams,
} from '@envelop/prometheus'
import { Plugin } from 'graphql-yoga'
import { Histogram, register as defaultRegistry } from 'prom-client'

export { createCounter, createHistogram, createSummary, FillLabelsFnParams }

export interface PrometheusTracingPluginConfig
  extends EnvelopPrometheusTracingPluginConfig {
  http?: boolean | ReturnType<typeof createHistogram>
  httpRequestHeaders?: boolean
  /**
   * The endpoint to serve metrics exposed by this plugin.
   * Defaults to "/metrics".
   */
  endpoint?: string
}

function headersToObj(headers: Headers) {
  const obj: Record<string, string> = {}
  headers.forEach((value, key) => {
    obj[key] = value
  })
  return obj
}

export function usePrometheus(options: PrometheusTracingPluginConfig): Plugin {
  const endpoint = options.endpoint || '/metrics'
  const registry = options.registry || defaultRegistry

  let httpHistogram: ReturnType<typeof createHistogram> | undefined

  if (options.http) {
    httpHistogram =
      typeof options.http === 'object'
        ? options.http
        : createHistogram({
            histogram: new Histogram({
              name: 'graphql_yoga_http_duration',
              help: 'Time spent on HTTP connection',
              labelNames: [
                'url',
                'method',
                'requestHeaders',
                'statusCode',
                'statusText',
                'responseHeaders',
              ],
              registers: [registry],
            }),
            fillLabelsFn(_, { request, response }) {
              return {
                url: request.url,
                method: request.method,
                requestHeaders: JSON.stringify(headersToObj(request.headers)),
                statusCode: response.status,
                statusText: response.statusText,
                responseHeaders: JSON.stringify(headersToObj(response.headers)),
              }
            },
          })
  }

  const startByRequest = new WeakMap<Request, number>()

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
    onResponse({ request, response, serverContext }) {
      const start = startByRequest.get(request)
      if (start) {
        const duration = Date.now() - start
        httpHistogram?.histogram.observe(
          httpHistogram.fillLabelsFn({}, { ...serverContext, response }),
          duration,
        )
      }
    },
  }
}
