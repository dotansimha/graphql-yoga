---
'@graphql-yoga/plugin-prometheus': major
---

Adds a cache for metrics definition (Summary, Histogram and Counter).

Fixes an issue preventing this plugin to be initialized multiple times, leading to metrics
duplication error (https://github.com/ardatan/graphql-mesh/issues/6545).

## Behavior Breaking Change:

Due to Prometheus client API limitations, a metric is only defined once for a given registry. This
means that if the configuration of the metrics, it will be silently ignored on plugin
re-initialization.

This is to avoid potential loss of metrics data produced between the plugin re-initialization and
the last pull by the prometheus agent.

If you need to be sure metrics configuration is up to date after a plugin re-initialization, you can
either:

- restart the whole node process instead of just recreating a graphql server at runtime
- clear the registry using `registry.clear()` before plugin re-initialization:
  ```ts
  function usePrometheusWithReset() {
    registry.clear()
    return usePrometheus({ ... })
  }
  ```
- use a new registry for each plugin instance:
  ```ts
  function usePrometheusWithRegistry() {
    const registry = new Registry()
    return usePrometheus({
      registry,
      ...
    })
  }
  ```

Keep in mind that this implies potential data loss in pull mode.

## API Breaking Change:

To ensure metrics from being registered multiple times on the same registry, the signature of
`createHistogram`, `createSummary` and `createCounter` have been changed to now include the registry
as a mandatory parameter.

If you were customizing metrics parameters, you will need to update the metric definitions

```diff
usePrometheus({
  execute: createHistogram({
+   registry: registry
    histogram: new Histogram({
      name: 'my_custom_name',
      help: 'HELP ME',
      labelNames: ['opText'] as const,
-     registers: [registry],
    }),
    fillLabelsFn: () => {}
  }),
  requestCount: createCounter({
+   registry: registry
    histogram: new Histogram({
      name: 'my_custom_name',
      help: 'HELP ME',
      labelNames: ['opText'] as const,
-     registers: [registry],
    }),
    fillLabelsFn: () => {}
  }),
  requestSummary: createSummary({
+   registry: registry
    histogram: new Histogram({
      name: 'my_custom_name',
      help: 'HELP ME',
      labelNames: ['opText'] as const,
-     registers: [registry],
    }),
    fillLabelsFn: () => {}
  }),
})
```

