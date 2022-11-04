---
'graphql-yoga': major
---

Remove `.inject` method to mock testing. Users should replace to use `fetch` method for testing. Checkout our docs on testing https://www.the-guild.dev/graphql/yoga-server/v3/features/testing.

```diff
import { createYoga } from 'graphql-yoga'
import { schema } from './schema'

const yoga = createYoga({ schema })


- const { response, executionResult } = await yoga.inject({
-   document: "query { ping }",
- })

+ const response = await yoga.fetch('http://localhost:4000/graphql', {
+   method: 'POST',
+   headers: {
+     'Content-Type': 'application/json',
+   },
+   body: JSON.stringify({
+     query: 'query { ping }',
+   }),
+ })
+ const executionResult = await response.json()

console.assert(response.status === 200, 'Response status should be 200')
console.assert(executionResult.data.ping === 'pong',`Expected 'pong'`)
```
