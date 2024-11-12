---
'@graphql-yoga/plugin-prometheus': major
---

Allow to explicitly control which events and timing should be observe.

Each metric can now be configured to observe events and timings only for certain GraphQL pipeline
phases, or depending on the request context.

Note: Phases can't be configured for the http request duration, because all phases are required for
this metric to work if enabled.

```ts
import { execute, parse, specifiedRules, subscribe, validate } from 'graphql'
import { envelop, useEngine } from '@envelop/core'
import { usePrometheus } from '@envelop/prometheus'

const TRACKED_OPERATION_NAMES = [
  // make a list of operation that you want to monitor
]

const getEnveloped = envelop({
  plugins: [
    useEngine({ parse, validate, specifiedRules, execute, subscribe }),
    usePrometheus({
      metrics: {

        // only trace errors of execute and subscribe phases
        graphql_envelop_phase_error: ['execute', 'subscribe']

        // only monitor timing of some operations
        graphql_yoga_http_duration: createHistogram({
          registry,
          histogram: {
            name: 'graphql_envelop_request_duration',
            help: 'Time spent on HTTP connection',
            labelNames: ['operation_name']
          },
          fillLabelsFn: ({ operationName }, _rawContext) => ({
            operation_name: operationName,
          }),
          phases: ['execute', 'subscribe'],

          // Here `shouldObserve` control if the request timing should be observed, based on context
          shouldObserve: (_, context) => TRACKED_OPERATIONS.includes(context?.params?.operationName),
        })
      },
    })
  ]
})
```

**Breaking Change**: A metric is enabled using `true` value in metrics options will observe in every
phases available.

Previously, which phase was observe was depending on which other metric were enabled. For example,
this config would only trace validation error:

```ts
usePrometheus({
  metrics: {
    graphql_envelop_phase_error: true,
    graphql_envelop_phase_validate: true,
  },
})
```

This is no longer the case. If you were relying on this behavior, please use an array of string to
restrict observed phases.

```ts
usePrometheus({
  metrics: {
    graphql_envelop_phase_error: ['validate'],
  },
})
```