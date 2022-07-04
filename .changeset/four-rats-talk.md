---
'@graphql-yoga/node': patch
---

**Use `req.body` only if it is filled**

Some frameworks use this unofficial `body` field to send the parsed body to the middlewares.
GraphQL Yoga respects that and uses this `body` as it is like a JSON request.
But sometimes speifically for multipart requests, `body` is present even if the actual request stream isn't parsed yet.
Now GraphQL Yoga checks the body content is filled to see if the request is bothered to make sure `body` is correct.

This fixes an issue that happens when you use `bodyParser` with `express`. `bodyParser` sends an empty `body` in case of `multipart` request.
