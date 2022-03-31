---
'@graphql-yoga/common': patch
---

fix(common): handle cors headers correctly

In case of an explicit definition of the allowed origins;

- If request origin doesn't match with the provided allowed origins, allowed origin header returns null which will cause the client fail.
- If request origin matches with the provided allowed origins, allowed origin header returns the request origin as it is.
- - Previously it used to return all origins at once then the client was failing no matter what.
- If no request origin is provided by the request, allowed origin header returns '\*'.
- - If credentials aren't explicitly allowed and request origin is missing in the headers, credentials header returns 'false' because '\*' and credentials aren't allowed per spec.
