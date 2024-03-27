---
'graphql-yoga': patch
---

always include empty data payload for `complete` event of sse responses to ensure `EventSource`
compatibility.
