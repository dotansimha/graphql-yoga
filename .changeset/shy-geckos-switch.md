---
'@graphql-yoga/common': minor
'@graphql-yoga/node': patch
---

## Correct status code for multipart request errors

Return correct 413 (Request Entity Too Large) HTTP status code if the given request body is larger then the specified one in `multipart` options.
Previously it was returning 400 or 500 which is an incorrect behavior misleading the client.

## Possible to configure the HTTP status code and headers of the response

Now we add a new `http` field to `GraphQLErrorExtensions` that you can set the status code and headers of the response;

```ts
throw new GraphQLError('You are not authorized to access this field', {
  extensions: {
    http: {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Bearer',
      },
    },
  },
})
```
