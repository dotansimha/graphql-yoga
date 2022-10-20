import {
  usePrometheus as useEnvelopPrometheus,
  PrometheusTracingPluginConfig as EnvelopPrometheusTracingPluginConfig,
} from '@envelop/prometheus'
import { Histogram, register as defaultRegistry } from 'prom-client'
import { Plugin } from 'graphql-yoga'

export interface PrometheusTracingPluginConfig
  extends EnvelopPrometheusTracingPluginConfig {
  http?: boolean | EnvelopPrometheusTracingPluginConfig['execute']
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

export function usePrometheus(
  options: PrometheusTracingPluginConfig,
): Plugin<any> {
  const endpoint = options.endpoint || '/metrics'
  const registry = options.registry || defaultRegistry

  const httpHistogram = new Histogram({
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
  })

  const startByRequest = new WeakMap<Request, number>()

  return {
    onPluginInit({ addPlugin }) {
      addPlugin(useEnvelopPrometheus({ ...options, registry }))
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
    onResponse({ request, response }) {
      const start = startByRequest.get(request)
      if (start) {
        const duration = Date.now() - start
        httpHistogram.observe(
          {
            url: request.url,
            method: request.method,
            requestHeaders: JSON.stringify(headersToObj(request.headers)),
            statusCode: response.status,
            statusText: response.statusText,
            responseHeaders: JSON.stringify(headersToObj(response.headers)),
          },
          duration,
        )
      }
    },
  }
}
