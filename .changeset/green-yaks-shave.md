---
'graphql-yoga': patch
---

More accurate HTTP status code when unsupported media type is sent as a request body.

Before it was returning `400: Bad Request` with `Request is not valid` text body in the response but now it returns `415: Unsupported Media Type` with an empty body.

Also see this unit test;
https://github.com/dotansimha/graphql-yoga/pull/2250/files#diff-78bcfa5f6d33aceeabdacd26e353641fea6fd125838ed0e1565762221568c777R380
