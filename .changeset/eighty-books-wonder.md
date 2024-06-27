---
'graphql-yoga': minor
---

By default, Yoga does not allow extra parameters in the request body other than `query`, `operationName`, `extensions`, and `variables`, then throws 400 HTTP Error.
This change adds a new option called `extraParamNames` to allow extra parameters in the request body.

```ts
import { createYoga } from 'graphql-yoga';

const yoga = createYoga({
  /* other options */
  extraParamNames: ['extraParam1', 'extraParam2'],
});

const res = await yoga.fetch('/graphql', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        query: 'query { __typename }',
        extraParam1: 'value1',
        extraParam2: 'value2',
    }),
});

console.assert(res.status === 200);
```