import {
  usePrometheus as useEnvelopPrometheus,
  PrometheusTracingPluginConfig as EnvelopPrometheusTracingPluginConfig,
} from '@envelop/prometheus'
import { register as defaultRegistry } from 'prom-client'
import { Plugin } from 'graphql-yoga'

export interface PrometheusTracingPluginConfig
  extends EnvelopPrometheusTracingPluginConfig {
  /**
   * The endpoint to serve metrics exposed by this plugin.
   * Defaults to "/metrics".
   */
  endpoint?: string
}

export function usePrometheus(
  options: PrometheusTracingPluginConfig,
): Plugin<any> {
  const endpoint = options.endpoint || '/metrics'
  const registry = options.registry || defaultRegistry

  return {
    onPluginInit({ addPlugin }) {
      addPlugin(useEnvelopPrometheus({ ...options, registry }))
    },
    async onRequest({ url, fetchAPI, endResponse }) {
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
  }
}
