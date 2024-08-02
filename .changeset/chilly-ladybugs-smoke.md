---
'@graphql-yoga/plugin-prometheus': major
---

**Breaking Change:** Rename all metrics options to their actual metric name to avoid confusion.

All metric options have been moved under a mandatory `metrics` key, and the name of each options
have been renamed to match the default metric name.

The plugin option argument is also now mandatory.

```diff
export const serveConfig = defineConfig({
  plugins: pluginCtx => [
    usePrometheus({
      ...pluginCtx,

      // Enable all available metrics
-     http: true
-     requestSummary: true,
-     parse: true,
-     validate: true,
-     contextBuilding: true,
-     execute: true,
-     subscribe: true,
-     errors: true,
-     deprecatedFields: true,
-     requestTotalDuration: true,
-     schemaChangeCount: true,

      // Warning: enabling resolvers level metrics will introduce significant overhead
-     resolvers: true,
+     metrics: {
+       graphql_yoga_http_duration: true,
+       graphql_envelop_request_time_summary: true,
+       graphql_envelop_phase_parse: true,
+       graphql_envelop_phase_validate: true,
+       graphql_envelop_phase_context: true,
+       graphql_envelop_phase_execute: true,
+       graphql_envelop_phase_subscribe: true,
+       graphql_envelop_error_result: true,
+       graphql_envelop_deprecated_field: true,
+       graphql_envelop_request_duration: true,
+       graphql_envelop_schema_change: true,

        // Warning: enabling resolvers level metrics will introduce significant overhead
+       graphql_envelop_execute_resolver: true,
+     }
    })
  ]
})
```

