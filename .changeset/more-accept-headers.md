---
'graphql-yoga': major
---

Now it is possible to decide the returned `Content-Type` by specifying the `Accept` header. So if `Accept` header has `text/event-stream` without `application/json`, Yoga respects that returns `text/event-stream` instead of `application/json`.
