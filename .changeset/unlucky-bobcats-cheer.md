---
'@graphql-yoga/node': patch
---

Previously the async iterable returned by GraphQL executor isn't cleaned up properly on Node environments because ReadableStream implementation of Node doesn't call defined "cancel" method in the right time. Now it has been patched in cross-undici-fetch and we ensure "Response.body" is destroyed after Node.js's ServerResponse is ended by any means
