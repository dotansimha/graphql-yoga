---
'graphql-yoga': patch
---

Always include empty data payload for final `complete` event of SSE stream responses to ensure [`EventSource`](https://developer.mozilla.org/en-US/docs/Web/API/EventSource) compatibility. See the [GraphQL over SSE protocol](https://github.com/enisdenjo/graphql-sse/blob/master/PROTOCOL.md#complete-event) for more information.
