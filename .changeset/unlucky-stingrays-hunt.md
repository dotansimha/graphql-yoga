---
'@graphql-yoga/common': patch
---

fix(common): handle cors headers correctly

If provided allowed origins aren't matching with the request origin, allowed origin header returns null.
If provided allowed origins are matching with the request origin, allowed origin header returns the request origin as is.
(Previously it was returning every single one)
If no request origin is provided, allowed origin header returns '\*'.
If '\*' needs to be returned as allowed origin, credentials are disabled.
