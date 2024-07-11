---
'@graphql-yoga/plugin-jwt': major
---

Re-write for the JWT plugin. This plugin can be configured now with multiple providers, lookup locations, token verification, and more. 

The version has better version coverage, and it provides an improved API for configuring provider and custom behaviors.

## Breaking Change: New Plugin Configuration

### Signing key providers

❌ The `signingKey` option has be removed.
❌ The `jwksUri` + `jwksOpts` options has been removed.
✅ Multiple signing key providers and support for fallbacks (`singingKeyProviders[]`).
✅ Improved API for defining signing key configuration.
✅ Better defaults for caching and rate-limiting for remote JWKS providers. 

#### Before

```ts
useJWT({
  signingKey: "...",
  // or
  jwksUri: "http://example.com/..."
  jwksOpts: {
    // ... 
  }
})
```

#### After

```ts
import {
  createInlineSigningKeyProvider,
  createRemoteJwksSigningKeyProvider,
  useJWT
} from '@graphql-yoga/plugin-jwt'

useJWT({
  // Pass one or more providers
  singingKeyProviders: [
    createRemoteJwksSigningKeyProvider({
      // ...
    })
    // This one also acts as a fallback in case of a fetching issue with the 1st provider
    createInlineSigningKeyProvider({ signingKey: "..."})
  ]
})
```

### Improved Token Lookup 

❌ Removed `getToken` option from the root config. 
✅ Added support for autmatically extracting the JWT token from cookie or header.
✅ Easier setup for extracting from multiple locations.
✅ `getToken` is still available for advanced use-cases, you can pass a custom function to `lookupLocations`.

#### Before

```ts
useJWT({
  getToken: (payload) => payload.request.headers.get("...") 
})
```

#### After

With built-in extractors:

```ts
imoprt { extractFromHeader, extractFromCookie, useJWT } from '@graphql-yoga/plugin-jwt'

const yoga = createYoga({
  // ...
  plugins: [
    useCookies(), // Required if "extractFromCookie" is used. 
    useJWT({
      lookupLocations: [
        extractFromHeader({ name: 'authorization', prefix: 'Bearer' }),
        extractFromHeader({ name: 'x-legacy-auth' }),
        extractFromHeader({ name: 'x-api-key', prefix: 'API-Access' }),
        extractFromCookie({ name: 'browserAuth' })
      ]
    })
  ]
})
```

With a custom `getToken`:

```ts
useJWT({
  lookupLocations: [
    (payload) => payload.request.headers.get("...") 
  ]
})
```

### Improved Verification Options

❌ Removed root-level config `algorithms` + `audience` + `issuer` flags.
✅ Easy API for customizing token verifications (based on `jsonwebtoken` library).
✅ Better defaults for token algorithm verification (before: `RS256`, after: `RS256` and `HS256`)

#### Before

```ts
useJWT({
  algorithms: ['RS256'],
  audience: "my.app",
  issuer: "http://my-issuer"
})
```

#### After

```ts
useJWT({
  tokenVerification: {
    algorithms: ['RS256', 'HS256'],
    audience: "my.app",
    issuer: "http://my-issuer",
    // You can pass more options to `jsonwebtoken.verify("...", options)` here 
  }
})
```

### Customized Token Rejection

✅ New config flag `reject: { ... }` for configuring how to handle a missing or invalid tokens (enbaled by default).


```ts
useJWT({
  reject: {
    missingToken: true,
    invalidToken: true,   
  }
})
```

### Flexible Context Injection

❌ Removed root-level config `extendContextField` flags.
✅ Added root-level config `extendContext` (`boolean` / `string`)
✅ Token and payload are injected now to the context (structure: `{ payload: {}, token: { value, prefix }}`)

#### Before

```ts
useJWT({
  reject: {
    extendContextField: true,
  }
})
```

#### After

```ts
// Can be a boolean. By default injects to "context.jwt" field 
useJWT({
  reject: {
    extendContext: true,
  }
})

// Or an object to customize the field name
useJWT({
  reject: {
    extendContext: "myJwt",
  }
})
```