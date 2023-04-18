---
'graphql-yoga': patch
---

Prevent errors thrown from subscription source crashing the Node.js process and instead log the error to the console, then terminate the client subscription.
