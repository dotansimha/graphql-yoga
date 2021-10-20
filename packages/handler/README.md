# `@graphql-yoga/handler`

Normalize request and response

```
                                            Normalized request object
                                            {
                                                body: {
                                                    query,
┌───────┐       Ensure it conforms                  variables,
│Request│─────▶ graphql-over-http  ────────▶        operationName,
└───────┘         and parse body                    extensions
                                                },
                                                method,
                                                headers
                                            }
```
