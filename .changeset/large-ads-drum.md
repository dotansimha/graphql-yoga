---
'graphql-yoga': minor
---

New hook: onExecutionResult which is triggered when an execution is done on the pipeline. If it is a
batched operation, this is called per each operation in the batch
