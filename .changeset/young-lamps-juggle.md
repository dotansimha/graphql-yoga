---
'graphql-yoga': minor
---

Support accessing the index of a batched request within the plugin phases.

The helper function `getBatchRequestIndexFromContext` can be used for getting the current batch
requests index for the ongoing execution.

```ts
import { createYoga, getBatchRequestIndexFromContext, Plugin } from 'graphql-yoga'

const yoga = createYoga({
  batched: true,
  plugins: [
    {
      onParams(params) {
        // undefined or number
        console.log(params.batchedRequestIndex)
      },
      onParse(context) {
        // undefined or number
        console.log(getBatchRequestIndexFromContext(context.context))
      },
      onValidate(context) {
        // undefined or number
        console.log(getBatchRequestIndexFromContext(context.context))
      },
      onExecute(context) {
        // undefined or number
        console.log(getBatchRequestIndexFromContext(context.args.contextValue))
      }
    } satisfies Plugin
  ]
})
```
