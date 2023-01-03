# graphql-yoga

## 3.3.1

### Patch Changes

- [#2275](https://github.com/dotansimha/graphql-yoga/pull/2275) [`d4dab446`](https://github.com/dotansimha/graphql-yoga/commit/d4dab446046695932a92ea4ccabb537a57bf3d00) Thanks [@ardatan](https://github.com/ardatan)! - Do not pass an explicit endpoint for GraphiQL

## 3.3.0

### Minor Changes

- [#2266](https://github.com/dotansimha/graphql-yoga/pull/2266) [`3e5f688f`](https://github.com/dotansimha/graphql-yoga/commit/3e5f688f2cbe02dd2fb4be69831d268aee52c5b5) Thanks [@ardatan](https://github.com/ardatan)! - Accept URL patterns like `/:path` and `*` in `graphqlEndpoint`

### Patch Changes

- [#2266](https://github.com/dotansimha/graphql-yoga/pull/2266) [`3e5f688f`](https://github.com/dotansimha/graphql-yoga/commit/3e5f688f2cbe02dd2fb4be69831d268aee52c5b5) Thanks [@ardatan](https://github.com/ardatan)! - dependencies updates:

  - Updated dependency [`@whatwg-node/fetch@0.6.1` ↗︎](https://www.npmjs.com/package/@whatwg-node/fetch/v/0.6.1) (from `0.5.4`, in `dependencies`)
  - Updated dependency [`@whatwg-node/server@0.5.3` ↗︎](https://www.npmjs.com/package/@whatwg-node/server/v/0.5.3) (from `0.5.1`, in `dependencies`)

- [#2269](https://github.com/dotansimha/graphql-yoga/pull/2269) [`8b288a23`](https://github.com/dotansimha/graphql-yoga/commit/8b288a23c882ec643406c7e3cf7a19980abdd381) Thanks [@renovate](https://github.com/apps/renovate)! - dependencies updates:
  - Updated dependency [`@whatwg-node/server@0.5.4` ↗︎](https://www.npmjs.com/package/@whatwg-node/server/v/0.5.4) (from `0.5.3`, in `dependencies`)

## 3.2.1

### Patch Changes

- [#2257](https://github.com/dotansimha/graphql-yoga/pull/2257) [`5528d312`](https://github.com/dotansimha/graphql-yoga/commit/5528d312d46281651b330c12f1b9f7a7d64ef3da) Thanks [@ardatan](https://github.com/ardatan)! - Handle errors thrown in onRequest correctly

## 3.2.0

### Minor Changes

- [#2150](https://github.com/dotansimha/graphql-yoga/pull/2150) [`290c7f7f`](https://github.com/dotansimha/graphql-yoga/commit/290c7f7fde5e604b2a8ac90f93b15e143ea09a92) Thanks [@ardatan](https://github.com/ardatan)! - Ping the client every 12 seconds to keep the connection alive

### Patch Changes

- [#2213](https://github.com/dotansimha/graphql-yoga/pull/2213) [`a86aaa0f`](https://github.com/dotansimha/graphql-yoga/commit/a86aaa0f673037e9207ca12e48f54e7e43963a47) Thanks [@renovate](https://github.com/apps/renovate)! - dependencies updates:

  - Updated dependency [`@graphql-tools/executor@0.0.11` ↗︎](https://www.npmjs.com/package/@graphql-tools/executor/v/0.0.11) (from `0.0.9`, in `dependencies`)
  - Updated dependency [`@whatwg-node/fetch@0.5.4` ↗︎](https://www.npmjs.com/package/@whatwg-node/fetch/v/0.5.4) (from `0.5.3`, in `dependencies`)
  - Updated dependency [`@whatwg-node/server@0.5.1` ↗︎](https://www.npmjs.com/package/@whatwg-node/server/v/0.5.1) (from `0.4.17`, in `dependencies`)

- [#2250](https://github.com/dotansimha/graphql-yoga/pull/2250) [`82f58934`](https://github.com/dotansimha/graphql-yoga/commit/82f5893446e3c55519194a1ca1d784120cbe7098) Thanks [@ardatan](https://github.com/ardatan)! - More accurate HTTP status code when unsupported media type is sent as a request body.

  Before it was returning `400: Bad Request` with `Request is not valid` text body in the response but now it returns `415: Unsupported Media Type` with an empty body.

  Also see this unit test;
  https://github.com/dotansimha/graphql-yoga/pull/2250/files#diff-78bcfa5f6d33aceeabdacd26e353641fea6fd125838ed0e1565762221568c777R380

## 3.1.2

### Patch Changes

- [#2231](https://github.com/dotansimha/graphql-yoga/pull/2231) [`c5b1cc46`](https://github.com/dotansimha/graphql-yoga/commit/c5b1cc46f67c4516fcaeb6247f56da4ca7dd7511) Thanks [@n1ru4l](https://github.com/n1ru4l)! - dependencies updates:

  - Updated dependency [`@envelop/parser-cache@^5.0.4` ↗︎](https://www.npmjs.com/package/@envelop/parser-cache/v/5.0.4) (from `5.0.4`, in `dependencies`)
  - Updated dependency [`@envelop/validation-cache@^5.0.5` ↗︎](https://www.npmjs.com/package/@envelop/validation-cache/v/5.0.5) (from `5.0.4`, in `dependencies`)

- [#2238](https://github.com/dotansimha/graphql-yoga/pull/2238) [`c152105e`](https://github.com/dotansimha/graphql-yoga/commit/c152105eeed34be2f6380406739a57310729f353) Thanks [@ardatan](https://github.com/ardatan)! - Do not call CORS headers factory twice

- [#2206](https://github.com/dotansimha/graphql-yoga/pull/2206) [`26d780cd`](https://github.com/dotansimha/graphql-yoga/commit/26d780cd683b15d38880387081455311b57da4ec) Thanks [@ardatan](https://github.com/ardatan)! - Correct Mask Error Factory signature

- [#2239](https://github.com/dotansimha/graphql-yoga/pull/2239) [`d2958781`](https://github.com/dotansimha/graphql-yoga/commit/d2958781d4f3959f89056092f6f12a2953f5497b) Thanks [@davidruisinger](https://github.com/davidruisinger)! - Add content-length: 0 header if 204 is returned by OPTIONS request

## 3.1.1

### Patch Changes

- [#2179](https://github.com/dotansimha/graphql-yoga/pull/2179) [`534780c9`](https://github.com/dotansimha/graphql-yoga/commit/534780c99ed61dd761826d44d99a83748630cb61) Thanks [@ardatan](https://github.com/ardatan)! - Add missing .js extension to type imports

## 3.1.0

### Minor Changes

- [#2145](https://github.com/dotansimha/graphql-yoga/pull/2145) [`ea81e1dd`](https://github.com/dotansimha/graphql-yoga/commit/ea81e1dda6c074e384221f19bd8a925693fa3427) Thanks [@n1ru4l](https://github.com/n1ru4l)! - Skip nullish query parameters in assertion.

### Patch Changes

- [#2165](https://github.com/dotansimha/graphql-yoga/pull/2165) [`86fe453c`](https://github.com/dotansimha/graphql-yoga/commit/86fe453c0ae1183af62359df0d61bba421d9f627) Thanks [@ardatan](https://github.com/ardatan)! - Export `useErrorHandler` to revert the unexpected breaking change

- [#2145](https://github.com/dotansimha/graphql-yoga/pull/2145) [`ea81e1dd`](https://github.com/dotansimha/graphql-yoga/commit/ea81e1dda6c074e384221f19bd8a925693fa3427) Thanks [@n1ru4l](https://github.com/n1ru4l)! - Avoid unnecessary iteration within internals

## 3.0.3

### Patch Changes

- [#2156](https://github.com/dotansimha/graphql-yoga/pull/2156) [`491ef5da`](https://github.com/dotansimha/graphql-yoga/commit/491ef5da7c6bcc3038fdb0909fd333a2b5217046) Thanks [@renovate](https://github.com/apps/renovate)! - dependencies updates:
  - Updated dependency [`@envelop/core@3.0.4` ↗︎](https://www.npmjs.com/package/@envelop/core/v/3.0.4) (from `3.0.3`, in `dependencies`)
  - Updated dependency [`@envelop/parser-cache@5.0.4` ↗︎](https://www.npmjs.com/package/@envelop/parser-cache/v/5.0.4) (from `5.0.3`, in `dependencies`)
  - Updated dependency [`@envelop/validation-cache@5.0.4` ↗︎](https://www.npmjs.com/package/@envelop/validation-cache/v/5.0.4) (from `5.0.3`, in `dependencies`)

## 3.0.2

### Patch Changes

- [#2154](https://github.com/dotansimha/graphql-yoga/pull/2154) [`0007c58d`](https://github.com/dotansimha/graphql-yoga/commit/0007c58d3ebc13cac694e561409fb2578ca5b882) Thanks [@ardatan](https://github.com/ardatan)! - Only Yoga's errors are now 200 when content-type is application/json

- [#2147](https://github.com/dotansimha/graphql-yoga/pull/2147) [`39a8fe89`](https://github.com/dotansimha/graphql-yoga/commit/39a8fe8977ec3c85d5ce5c643002aa79e6283f79) Thanks [@ardatan](https://github.com/ardatan)! - Bump @whatwg-node/server to fix the conflict issue between webworker & dom TS typing libs

## 3.0.1

### Patch Changes

- [#2125](https://github.com/dotansimha/graphql-yoga/pull/2125) [`d63fe841`](https://github.com/dotansimha/graphql-yoga/commit/d63fe84157662896c372feb013b73c6f290a2d3b) Thanks [@enisdenjo](https://github.com/enisdenjo)! - application/json is the default when accept is missing until watershed

## 3.0.0

### Major Changes

- [`2e0c4824`](https://github.com/dotansimha/graphql-yoga/commit/2e0c482418af2281c9cf0c34dd16f207d850cdb7) Thanks [@b4s36t4](https://github.com/b4s36t4)! - _Drop Node 12 Support_

  GraphQL Yoga no longer supports Node 12 which is no longer an LTS version. GraphQL Yoga now needs Node 14 at least.

- [#2012](https://github.com/dotansimha/graphql-yoga/pull/2012) [`720898db`](https://github.com/dotansimha/graphql-yoga/commit/720898dbf923a7aa52ff63e50e25527be1e8921b) Thanks [@saihaj](https://github.com/saihaj)! - Remove `.inject` method to mock testing. Users should replace to use `fetch` method for testing.

  Checkout our docs on testing https://www.the-guild.dev/graphql/yoga-server/v3/features/testing.

  ```diff
  import { createYoga } from 'graphql-yoga'
  import { schema } from './schema'

  const yoga = createYoga({ schema })

  - const { response, executionResult } = await yoga.inject({
  -   document: "query { ping }",
  - })

  + const response = await yoga.fetch('http://yoga/graphql', {
  +   method: 'POST',
  +   headers: {
  +     'Content-Type': 'application/json',
  +   },
  +   body: JSON.stringify({
  +     query: 'query { ping }',
  +   }),
  + })
  + const executionResult = await response.json()

  console.assert(response.status === 200, 'Response status should be 200')
  console.assert(executionResult.data.ping === 'pong',`Expected 'pong'`)
  ```

- [#1753](https://github.com/dotansimha/graphql-yoga/pull/1753) [`eeaced00`](https://github.com/dotansimha/graphql-yoga/commit/eeaced008fdd1b209d6db81f3351803f2a0a1089) Thanks [@ardatan](https://github.com/ardatan)! - `schema` no longer accepts an object of `typeDefs` and `resolvers` but instead you can use `createSchema` to create a GraphQL schema.

- [#1516](https://github.com/dotansimha/graphql-yoga/pull/1516) [`209b1620`](https://github.com/dotansimha/graphql-yoga/commit/209b1620055cf64647943b1c334852a314aff3a4) Thanks [@ardatan](https://github.com/ardatan)! - Now it is possible to decide the returned `Content-Type` by specifying the `Accept` header. So if `Accept` header has `text/event-stream` without `application/json`, Yoga respects that returns `text/event-stream` instead of `application/json`.

- [#1808](https://github.com/dotansimha/graphql-yoga/pull/1808) [`02d2aecd`](https://github.com/dotansimha/graphql-yoga/commit/02d2aecdee55e4c54454c48c2ca0fd7425796ae0) Thanks [@enisdenjo](https://github.com/enisdenjo)! - Drop `readinessCheckEndpoint` in favor of the `useReadinessCheck` plugin

  [See docs for more information](https://www.the-guild.dev/graphql/yoga-server/v3/features/health-check#readiness)

- [#1473](https://github.com/dotansimha/graphql-yoga/pull/1473) [`c4b3a9c8`](https://github.com/dotansimha/graphql-yoga/commit/c4b3a9c8031f7b61420bb9cdc4bc6e7fc22615a5) Thanks [@ardatan](https://github.com/ardatan)! - Replace `GraphQLYogaError` in favor of `GraphQLError`.

  [Check the documentation to see how to use `GraphQLError`](https://www.graphql-yoga.com/v3/guides/error-masking)

- [#1660](https://github.com/dotansimha/graphql-yoga/pull/1660) [`71554172`](https://github.com/dotansimha/graphql-yoga/commit/715541729f76be82d9f959a96e7af6126836df87) Thanks [@saihaj](https://github.com/saihaj)! - Update to the latest version of the envelop `useMaskedError` plugin.

  - Removed `handleValidationErrors` and `handleParseErrors`
  - Renamed `formatError` to `maskError`

  [Checkout Envelop docs for more details](https://www.the-guild.dev/graphql/envelop/v3/guides/migrating-from-v2-to-v3#8-update-options-for-usemaskederrors-plugin)

- [#2091](https://github.com/dotansimha/graphql-yoga/pull/2091) [`1d508495`](https://github.com/dotansimha/graphql-yoga/commit/1d50849526f5a8b23beac3c542826a70ac286ae7) Thanks [@ardatan](https://github.com/ardatan)! - Export only specific utilities from `@envelop/core`.

### Minor Changes

- [#1966](https://github.com/dotansimha/graphql-yoga/pull/1966) [`6e250209`](https://github.com/dotansimha/graphql-yoga/commit/6e25020916670fb50fecb5ff7c25f7216db3d78a) Thanks [@saihaj](https://github.com/saihaj)! - Use `@graphql-tools/executor` as a default GraphQL Executor in favor of `graphql-js`.

- [#1497](https://github.com/dotansimha/graphql-yoga/pull/1497) [`1d7f810a`](https://github.com/dotansimha/graphql-yoga/commit/1d7f810a8ee3fc00f6dbde461010683eb354da2d) Thanks [@ardatan](https://github.com/ardatan)! - Support a schema factory function that runs per request or a promise to be resolved before the first request.

  ```ts
  createYoga({
    schema(request: Request) {
      return getSchemaForToken(request.headers.get('x-my-token'))
    }
  })
  ```

  ```ts
  async function buildSchemaAsync() {
    const typeDefs = await fs.promises.readFile('./schema.graphql', 'utf8')
    const resolvers = await import('./resolvers.js')
    return makeExecutableSchema({ typeDefs, resolvers })
  }

  createYoga({
    schema: buildSchemaAsync()
  })
  ```

- [#1662](https://github.com/dotansimha/graphql-yoga/pull/1662) [`098e139f`](https://github.com/dotansimha/graphql-yoga/commit/098e139f2b08196bfee04a71bcd024501dceacd8) Thanks [@ardatan](https://github.com/ardatan)! - - Batching RFC support with `batchingLimit` option to enable batching with an exact limit of requests per batch.
  - New `onParams` hook that takes a single `GraphQLParams` object
  - Changes in `onRequestParse` and `onRequestParseDone` hook
  - Now `onRequestParseDone` receives the exact object that is passed by the request parser so it can be `GraphQLParams` or an array of `GraphQLParams` so use `onParams` if you need to manipulate batched execution params individually.

### Patch Changes

- [#1997](https://github.com/dotansimha/graphql-yoga/pull/1997) [`8773a27f`](https://github.com/dotansimha/graphql-yoga/commit/8773a27ffb7f50a4b1f8c044d2a0c428d14e4fee) Thanks [@saihaj](https://github.com/saihaj)! - **Defer and Stream Support**

  [See the docs for more information](https://www.the-guild.dev/graphql/yoga-server/v3/features/defer-stream)

- [#2024](https://github.com/dotansimha/graphql-yoga/pull/2024) [`9f991a27`](https://github.com/dotansimha/graphql-yoga/commit/9f991a2767d374f1d6ab37445e65f748d5a1fe6d) Thanks [@enisdenjo](https://github.com/enisdenjo)! - Ensure all parsing failures in `GraphQLScalarType` are caught and handled with 400 status code.

- [#1920](https://github.com/dotansimha/graphql-yoga/pull/1920) [`cebca219`](https://github.com/dotansimha/graphql-yoga/commit/cebca219c4913f45509c3a40f0f5aa6697f5914d) Thanks [@enisdenjo](https://github.com/enisdenjo)! - Handle edge case where `Content-Type` header provides a list like;

  ```
  Content-Type: application/json, text/plain, */*
  ```

- [#1609](https://github.com/dotansimha/graphql-yoga/pull/1609) [`74e1f830`](https://github.com/dotansimha/graphql-yoga/commit/74e1f830b09bc21a970f7468af1363a22b8b592b) Thanks [@enisdenjo](https://github.com/enisdenjo)! - `usePreventMutationViaGET` doesn't do assertion if it is not `YogaContext`, so it is possible to use Yoga's Envelop instance with other server implementations like `graphql-ws`.

- [#1567](https://github.com/dotansimha/graphql-yoga/pull/1567) [`e7a47b56`](https://github.com/dotansimha/graphql-yoga/commit/e7a47b56fbdf3abbb8f0d590ade867805a84157e) Thanks [@n1ru4l](https://github.com/n1ru4l)! - Handle invalid POST body gracefully. Reject `null`, non-object bodies or invalid JSON bodies.

- [#1911](https://github.com/dotansimha/graphql-yoga/pull/1911) [`5f5b1160`](https://github.com/dotansimha/graphql-yoga/commit/5f5b116084cff45ed49f0c74cc449ff20fd775ac) Thanks [@enisdenjo](https://github.com/enisdenjo)! - Handle cases where user supplies a malformed/unexpected context. Preventing GraphQL Yoga to crash and existing prematurely.

- [`73e56068`](https://github.com/dotansimha/graphql-yoga/commit/73e56068fd1c1c06a0cf08150d5b79ce7c49992a) Thanks [@ardatan](https://github.com/ardatan)! - Fix cancellation logic for defer/stream queries.

- [#1609](https://github.com/dotansimha/graphql-yoga/pull/1609) [`74e1f830`](https://github.com/dotansimha/graphql-yoga/commit/74e1f830b09bc21a970f7468af1363a22b8b592b) Thanks [@enisdenjo](https://github.com/enisdenjo)! - Expose readonly `graphqlEndpoint` in `YogaServerInstance`

  ```ts
  const yoga = createYoga({
    /*...*/
  })
  console.log(yoga.graphqlEndpoint) // /graphql by default
  ```

- [#1844](https://github.com/dotansimha/graphql-yoga/pull/1844) [`b079c93b`](https://github.com/dotansimha/graphql-yoga/commit/b079c93ba47dc94d58f7d2b738a9423c29a149a1) Thanks [@ardatan](https://github.com/ardatan)! - All unexpected errors even if they are masked/wrapped
  The HTTP status code will be determined by the specific protocol the client is sending.

  > "Unexpected error." means an Error that is not an instance of GraphQLError or an instance of GraphQLError with an `originalError` that is not an instance of GraphQLError recursively.

- [#1988](https://github.com/dotansimha/graphql-yoga/pull/1988) [`b19a9104`](https://github.com/dotansimha/graphql-yoga/commit/b19a910447d27e2203bb5e22aaba6ab72d54b560) Thanks [@ardatan](https://github.com/ardatan)! - Respect the order of mime types given in the accept header by the client.

- [#1616](https://github.com/dotansimha/graphql-yoga/pull/1616) [`1d5cde96`](https://github.com/dotansimha/graphql-yoga/commit/1d5cde96ce5b7647de7d329f9f56e398463a9152) Thanks [@ardatan](https://github.com/ardatan)! - Allow the content type `application/graphql-response+json` as the `Accept` header value.

- [#1775](https://github.com/dotansimha/graphql-yoga/pull/1775) [`44878a5b`](https://github.com/dotansimha/graphql-yoga/commit/44878a5b1be937ab0ffefccc327400c80bd62847) Thanks [@enisdenjo](https://github.com/enisdenjo)! - Improve the context type for server and request context.

- Updated dependencies [[`b2407c6a`](https://github.com/dotansimha/graphql-yoga/commit/b2407c6addab136e3390bd4efa1fbbad7eb8dab8)]:
  - @graphql-yoga/subscription@3.0.0

## 3.0.0-next.12

### Patch Changes

- [`73e56068`](https://github.com/dotansimha/graphql-yoga/commit/73e56068fd1c1c06a0cf08150d5b79ce7c49992a) Thanks [@ardatan](https://github.com/ardatan)! - Fix cancellation logic for defer/stream queries

## 3.0.0-next.11

### Major Changes

- [#2012](https://github.com/dotansimha/graphql-yoga/pull/2012) [`720898db`](https://github.com/dotansimha/graphql-yoga/commit/720898dbf923a7aa52ff63e50e25527be1e8921b) Thanks [@saihaj](https://github.com/saihaj)! - Remove `.inject` method to mock testing. Users should replace to use `fetch` method for testing. Checkout our docs on testing https://www.the-guild.dev/graphql/yoga-server/v3/features/testing.

  ```diff
  import { createYoga } from 'graphql-yoga'
  import { schema } from './schema'

  const yoga = createYoga({ schema })

  - const { response, executionResult } = await yoga.inject({
  -   document: "query { ping }",
  - })

  + const response = await yoga.fetch('http://localhost:4000/graphql', {
  +   method: 'POST',
  +   headers: {
  +     'Content-Type': 'application/json',
  +   },
  +   body: JSON.stringify({
  +     query: 'query { ping }',
  +   }),
  + })
  + const executionResult = await response.json()

  console.assert(response.status === 200, 'Response status should be 200')
  console.assert(executionResult.data.ping === 'pong',`Expected 'pong'`)
  ```

### Patch Changes

- [#2024](https://github.com/dotansimha/graphql-yoga/pull/2024) [`9f991a27`](https://github.com/dotansimha/graphql-yoga/commit/9f991a2767d374f1d6ab37445e65f748d5a1fe6d) Thanks [@enisdenjo](https://github.com/enisdenjo)! - Ensure all parsing failures in `GraphQLScalarType` are caught and handled with 400 status code.

- [#2058](https://github.com/dotansimha/graphql-yoga/pull/2058) [`ef191eee`](https://github.com/dotansimha/graphql-yoga/commit/ef191eeeba63d96a4a141126c6fc5f4cf992e2d2) Thanks [@enisdenjo](https://github.com/enisdenjo)! - Simplify landing page and fix links

## 3.0.0-next.10

### Patch Changes

- [#1997](https://github.com/dotansimha/graphql-yoga/pull/1997) [`8773a27f`](https://github.com/dotansimha/graphql-yoga/commit/8773a27ffb7f50a4b1f8c044d2a0c428d14e4fee) Thanks [@saihaj](https://github.com/saihaj)! - introduce a new plugin for defer and stream instead of making it default in yoga

- [#1996](https://github.com/dotansimha/graphql-yoga/pull/1996) [`cedde92f`](https://github.com/dotansimha/graphql-yoga/commit/cedde92fead65bcc4c08bb31d4c2400f92fd83d2) Thanks [@enisdenjo](https://github.com/enisdenjo)! - Support older version of GraphQLjs

- [#1992](https://github.com/dotansimha/graphql-yoga/pull/1992) [`bf69a561`](https://github.com/dotansimha/graphql-yoga/commit/bf69a561b3c18b8b2736c2a72da0a59244f6f62b) Thanks [@saihaj](https://github.com/saihaj)! - inline functions to support multiple version of graphql-js

## 3.0.0-next.9

### Minor Changes

- [#1936](https://github.com/dotansimha/graphql-yoga/pull/1936) [`87a6c333`](https://github.com/dotansimha/graphql-yoga/commit/87a6c3331a81503c07f211296e75ca0c5e060f0a) Thanks [@renovate](https://github.com/apps/renovate)! - Engine and graphql-js version agnostic Defer/Stream support

### Patch Changes

- [#1988](https://github.com/dotansimha/graphql-yoga/pull/1988) [`b19a9104`](https://github.com/dotansimha/graphql-yoga/commit/b19a910447d27e2203bb5e22aaba6ab72d54b560) Thanks [@ardatan](https://github.com/ardatan)! - Respect the order of mime types given in the accept header by the client

## 3.0.0-next.8

### Minor Changes

- [#1966](https://github.com/dotansimha/graphql-yoga/pull/1966) [`6e250209`](https://github.com/dotansimha/graphql-yoga/commit/6e25020916670fb50fecb5ff7c25f7216db3d78a) Thanks [@saihaj](https://github.com/saihaj)! - use custom executor

## 3.0.0-next.7

### Patch Changes

- [#1920](https://github.com/dotansimha/graphql-yoga/pull/1920) [`cebca219`](https://github.com/dotansimha/graphql-yoga/commit/cebca219c4913f45509c3a40f0f5aa6697f5914d) Thanks [@enisdenjo](https://github.com/enisdenjo)! - Handle edge case where Content-Type header provides a list

- [#1911](https://github.com/dotansimha/graphql-yoga/pull/1911) [`5f5b1160`](https://github.com/dotansimha/graphql-yoga/commit/5f5b116084cff45ed49f0c74cc449ff20fd775ac) Thanks [@enisdenjo](https://github.com/enisdenjo)! - Handle cases where user supplies a malformed/unexpected context

## 3.0.0-next.6

### Patch Changes

- [#1903](https://github.com/dotansimha/graphql-yoga/pull/1903) [`dc45a7b5`](https://github.com/dotansimha/graphql-yoga/commit/dc45a7b57d4248501429c1bf66c0cd6ca36926fd) Thanks [@saihaj](https://github.com/saihaj)! - remove graphql tools as dep

## 3.0.0-next.5

### Major Changes

- [#1660](https://github.com/dotansimha/graphql-yoga/pull/1660) [`71554172`](https://github.com/dotansimha/graphql-yoga/commit/715541729f76be82d9f959a96e7af6126836df87) Thanks [@saihaj](https://github.com/saihaj)! - update to Envelop `useMaskedError` plugin

  - Removed handleValidationErrors and handleParseErrors
  - Renamed formatError to maskError

  Checkout envelop docs for more details https://www.the-guild.dev/graphql/envelop/v3/guides/migrating-from-v2-to-v3#8-update-options-for-usemaskederrors-plugin

## 3.0.0-next.4

### Major Changes

- [#1808](https://github.com/dotansimha/graphql-yoga/pull/1808) [`02d2aecd`](https://github.com/dotansimha/graphql-yoga/commit/02d2aecdee55e4c54454c48c2ca0fd7425796ae0) Thanks [@enisdenjo](https://github.com/enisdenjo)! - Drop `readinessCheckEndpoint` and introduce `useReadinessCheck` plugin

### Patch Changes

- [#1844](https://github.com/dotansimha/graphql-yoga/pull/1844) [`b079c93b`](https://github.com/dotansimha/graphql-yoga/commit/b079c93ba47dc94d58f7d2b738a9423c29a149a1) Thanks [@ardatan](https://github.com/ardatan)! - - All unexpected errors even if they are masked/wrapped, HTTP status code will be set to 500.

  > "Unexpected error" means an Error that is not an instance of GraphQLError or an instance of GraphQLError with an `originalError` that is not an instance of GraphQLError recursively.

## 3.0.0-next.3

### Patch Changes

- [`64e06d74`](https://github.com/dotansimha/graphql-yoga/commit/64e06d74132a118f30b42b51c0e71abced0506a4) Thanks [@ardatan](https://github.com/ardatan)! - Fix execute/stop button

## 3.0.0-next.2

### Patch Changes

- [#1794](https://github.com/dotansimha/graphql-yoga/pull/1794) [`8c674c36`](https://github.com/dotansimha/graphql-yoga/commit/8c674c365e0bac176ca296e8d531fcd28d228d5b) Thanks [@ardatan](https://github.com/ardatan)! - dependencies updates:

  - Updated dependency [`@whatwg-node/fetch@0.4.6` ↗︎](https://www.npmjs.com/package/@whatwg-node/fetch/v/0.4.6) (from `0.4.5`, in `dependencies`)
  - Updated dependency [`@whatwg-node/server@0.4.10` ↗︎](https://www.npmjs.com/package/@whatwg-node/server/v/0.4.10) (from `0.4.7`, in `dependencies`)
  - Added dependency [`@graphql-tools/utils@8.12.0` ↗︎](https://www.npmjs.com/package/@graphql-tools/utils/v/8.12.0) (to `dependencies`)

## 3.0.0-next.1

### Patch Changes

- [#1775](https://github.com/dotansimha/graphql-yoga/pull/1775) [`44878a5b`](https://github.com/dotansimha/graphql-yoga/commit/44878a5b1be937ab0ffefccc327400c80bd62847) Thanks [@enisdenjo](https://github.com/enisdenjo)! - Context typings improvements

## 3.0.0-next.0

### Major Changes

- [#1660](https://github.com/dotansimha/graphql-yoga/pull/1660) [`2e0c4824`](https://github.com/dotansimha/graphql-yoga/commit/2e0c482418af2281c9cf0c34dd16f207d850cdb7) Thanks [@saihaj](https://github.com/saihaj)! - _Drop Node 12 Support_

  GraphQL Yoga no longer supports Node 12 which is no longer an LTS version. GraphQL Yoga now needs Node 14 at least.

- [#1660](https://github.com/dotansimha/graphql-yoga/pull/1660) [`f46addd7`](https://github.com/dotansimha/graphql-yoga/commit/f46addd767f38bc3a48d796b0f2cb02c5f5668ef) Thanks [@saihaj](https://github.com/saihaj)! - See the migration guide for more information;

  [Migration from Yoga V2](https://www.graphql-yoga.com/v3/migration/migration-from-yoga-v2)

- [#1753](https://github.com/dotansimha/graphql-yoga/pull/1753) [`eeaced00`](https://github.com/dotansimha/graphql-yoga/commit/eeaced008fdd1b209d6db81f3351803f2a0a1089) Thanks [@ardatan](https://github.com/ardatan)! - `schema` no longer accepts an object of `typeDefs` and `resolvers` but instead you can use `createSchema` to create a GraphQL schema.

- [#1516](https://github.com/dotansimha/graphql-yoga/pull/1516) [`209b1620`](https://github.com/dotansimha/graphql-yoga/commit/209b1620055cf64647943b1c334852a314aff3a4) Thanks [@ardatan](https://github.com/ardatan)! - Now it is possible to decide the returned `Content-Type` by specifying the `Accept` header. So if `Accept` header has `text/event-stream` without `application/json`, Yoga respects that returns `text/event-stream` instead of `application/json`.

- [#1473](https://github.com/dotansimha/graphql-yoga/pull/1473) [`c4b3a9c8`](https://github.com/dotansimha/graphql-yoga/commit/c4b3a9c8031f7b61420bb9cdc4bc6e7fc22615a5) Thanks [@ardatan](https://github.com/ardatan)! - **BREAKING**: Remove `GraphQLYogaError` in favor of `GraphQLError`
  [Check the documentation to see how to use `GraphQLError`](https://www.graphql-yoga.com/v3/guides/error-masking)

### Minor Changes

- [#1610](https://github.com/dotansimha/graphql-yoga/pull/1610) [`f4b23387`](https://github.com/dotansimha/graphql-yoga/commit/f4b233876c2db52886eb5211b029377450fdb7f1) Thanks [@ardatan](https://github.com/ardatan)! - Pass the parsed request as-is and validate the final GraphQLParams in useCheckGraphQLParams

- [#1497](https://github.com/dotansimha/graphql-yoga/pull/1497) [`1d7f810a`](https://github.com/dotansimha/graphql-yoga/commit/1d7f810a8ee3fc00f6dbde461010683eb354da2d) Thanks [@ardatan](https://github.com/ardatan)! - Support a schema factory function that runs per request or a promise to be resolved before the first request.

  ```ts
  createYoga({
    schema(request: Request) {
      return getSchemaForToken(request.headers.get('x-my-token'))
    }
  })
  ```

  ```ts
  async function buildSchemaAsync() {
    const typeDefs = await fs.promises.readFile('./schema.graphql', 'utf8')
    const resolvers = await import('./resolvers.js')
    return makeExecutableSchema({ typeDefs, resolvers })
  }

  createYoga({
    schema: buildSchemaAsync()
  })
  ```

- [#1662](https://github.com/dotansimha/graphql-yoga/pull/1662) [`098e139f`](https://github.com/dotansimha/graphql-yoga/commit/098e139f2b08196bfee04a71bcd024501dceacd8) Thanks [@ardatan](https://github.com/ardatan)! - - Batching RFC support with `batchingLimit` option to enable batching with an exact limit of requests per batch.
  - New `onParams` hook that takes a single `GraphQLParams` object
  - Changes in `onRequestParse` and `onRequestParseDone` hook
  - - Now `onRequestParseDone` receives the exact object that is passed by the request parser so it can be `GraphQLParams` or an array of `GraphQLParams` so use `onParams` if you need to manipulate batched execution params individually.

### Patch Changes

- [#1609](https://github.com/dotansimha/graphql-yoga/pull/1609) [`74e1f830`](https://github.com/dotansimha/graphql-yoga/commit/74e1f830b09bc21a970f7468af1363a22b8b592b) Thanks [@enisdenjo](https://github.com/enisdenjo)! - `usePreventMutationViaGET` doesn't do assertion if it is not `YogaContext`, so it is possible to use Yoga's Envelop instance with other server implementations like `graphql-ws`.

- [#1567](https://github.com/dotansimha/graphql-yoga/pull/1567) [`e7a47b56`](https://github.com/dotansimha/graphql-yoga/commit/e7a47b56fbdf3abbb8f0d590ade867805a84157e) Thanks [@n1ru4l](https://github.com/n1ru4l)! - Handle invalid POST body gracefully; - Reject `null` - Reject non-object body - Reject invalid JSON body

- [#1609](https://github.com/dotansimha/graphql-yoga/pull/1609) [`74e1f830`](https://github.com/dotansimha/graphql-yoga/commit/74e1f830b09bc21a970f7468af1363a22b8b592b) Thanks [@enisdenjo](https://github.com/enisdenjo)! - Expose readonly `graphqlEndpoint` in `YogaServerInstance`

  ```ts
  const yoga = createYoga({
    /*...*/
  })
  console.log(yoga.graphqlEndpoint) // /graphql by default
  ```

- [#1616](https://github.com/dotansimha/graphql-yoga/pull/1616) [`1d5cde96`](https://github.com/dotansimha/graphql-yoga/commit/1d5cde96ce5b7647de7d329f9f56e398463a9152) Thanks [@ardatan](https://github.com/ardatan)! - Support `application/graphql-response+json` as `Accept`ed content type for the response

- Updated dependencies [[`b2407c6a`](https://github.com/dotansimha/graphql-yoga/commit/b2407c6addab136e3390bd4efa1fbbad7eb8dab8)]:
  - @graphql-yoga/subscription@3.0.0-next.0

## 2.13.11

### Patch Changes

- Updated dependencies []:
  - @graphql-yoga/node@2.13.11

## 2.13.10

### Patch Changes

- Updated dependencies [[`779b55ee`](https://github.com/dotansimha/graphql-yoga/commit/779b55eea843bd282f659e1012f255f62fd888b6)]:
  - @graphql-yoga/node@2.13.10

## 2.13.9

### Patch Changes

- Updated dependencies []:
  - @graphql-yoga/node@2.13.9

## 2.13.8

### Patch Changes

- Updated dependencies []:
  - @graphql-yoga/node@2.13.8

## 2.13.7

### Patch Changes

- Updated dependencies [[`e4e8ade`](https://github.com/dotansimha/graphql-yoga/commit/e4e8ade526c2aec7ea28218ca7795e96b867fc6b), [`94b41f3`](https://github.com/dotansimha/graphql-yoga/commit/94b41f30f598afb37db2438c736764e2a539cd10)]:
  - @graphql-yoga/node@2.13.7

## 2.13.6

### Patch Changes

- eecf24c: Fix CommonJS TypeScript resolution with `moduleResolution` `node16` or `nodenext`
- Updated dependencies [eecf24c]
  - @graphql-yoga/node@2.13.6

## 2.13.5

### Patch Changes

- Updated dependencies [c00dad3]
  - @graphql-yoga/node@2.13.5

## 2.13.4

### Patch Changes

- @graphql-yoga/node@2.13.4

## 2.13.3

### Patch Changes

- Updated dependencies [639607d]
  - @graphql-yoga/node@2.13.3

## 2.13.2

### Patch Changes

- @graphql-yoga/node@2.13.2

## 2.13.1

### Patch Changes

- @graphql-yoga/node@2.13.1

## 2.13.0

### Patch Changes

- @graphql-yoga/node@2.13.0

## 2.12.0

### Patch Changes

- @graphql-yoga/node@2.12.0

## 2.11.2

### Patch Changes

- Updated dependencies [ca5f940]
  - @graphql-yoga/node@2.11.2

## 2.11.1

### Patch Changes

- Updated dependencies [9248df8]
  - @graphql-yoga/node@2.11.1

## 2.11.0

### Patch Changes

- Updated dependencies [8947657]
  - @graphql-yoga/node@2.11.0

## 2.10.0

### Minor Changes

- 7de07cd: Support TypeScript ECMA script resolution. More information on https://devblogs.microsoft.com/typescript/announcing-typescript-4-7/#ecmascript-module-support-in-node-js

### Patch Changes

- Updated dependencies [7de07cd]
- Updated dependencies [8922c3b]
  - @graphql-yoga/node@2.10.0

## 2.9.2

### Patch Changes

- @graphql-yoga/node@2.9.2

## 2.9.1

### Patch Changes

- @graphql-yoga/node@2.9.1

## 2.9.0

### Patch Changes

- Updated dependencies [06652c7]
- Updated dependencies [2d3c54c]
  - @graphql-yoga/node@2.9.0

## 2.8.0

### Patch Changes

- @graphql-yoga/node@2.8.0

## 2.7.0

### Patch Changes

- @graphql-yoga/node@2.7.0

## 2.6.1

### Patch Changes

- Updated dependencies [0224bf9]
  - @graphql-yoga/node@2.6.1

## 2.6.0

### Patch Changes

- @graphql-yoga/node@2.6.0

## 2.5.0

### Patch Changes

- Updated dependencies [8b6d896]
  - @graphql-yoga/node@2.5.0

## 2.4.1

### Patch Changes

- @graphql-yoga/node@2.4.1

## 2.4.0

### Patch Changes

- Updated dependencies [28e24c3]
- Updated dependencies [13f96db]
  - @graphql-yoga/node@2.4.0

## 2.3.0

### Patch Changes

- @graphql-yoga/node@2.3.0

## 2.2.1

### Patch Changes

- Updated dependencies [32e2e40]
  - @graphql-yoga/node@2.2.1

## 2.2.0

### Patch Changes

- Updated dependencies [1d4fe42]
  - @graphql-yoga/node@2.2.0

## 2.1.0

### Patch Changes

- Updated dependencies [4077773]
- Updated dependencies [2739db2]
- Updated dependencies [cd9394e]
  - @graphql-yoga/node@2.1.0

## 2.0.0

### Major Changes

- b6dd3f1: The goal is to provide a fully-featured, simple to set up, performant and extendable server. Some key features:

  - [GraphQL-over-HTTP](https://github.com/graphql/graphql-over-http) spec compliant
  - Extend the GraphQL request flow using [`envelop`](https://www.envelop.dev/)
  - File uploads (via GraphQL multipart request specification)
  - GraphQL Subscriptions (using [SSE](https://github.com/enisdenjo/graphql-sse))
  - Logging using [Pino](https://github.com/pinojs/pino)
  - Improved TypeScript Support
  - Try out experimental GraphQL features such as `@defer` and `@stream`

- de1693e: trigger release

### Minor Changes

- 6750eff: rename `GraphQLServerError` to `GraphQLYogaError`.
- 0edf1f8: feat: options for GraphiQL
- d414f95: **BREAKING** Set `maskedErrors` value to `true` by default for safer defaults.

  **BREAKING** Remove `disableIntrospection`. [Please use `useDisableIntrospection` from `@envelop/disable-introspection` instead.](https://www.envelop.dev/plugins/use-disable-introspection)

- 36af58e: export renderGraphiQL function
- bea2dcc: align envelop types
- fc1f2c7: make options optional
- fb894da: Rename createGraphQLServer to createServer
- 1a20e1e: Export everything from @envelop/core and export GraphQLFile scalar
- d078e84: Drop fastify and use node-http package
- 6d60ebf: add tabs to GraphiQL
- 9554f81: Add PubSub utility.
- 95e0ac0: feat: remove unnecessary Upload scalar types
- dcaea56: add missing tslib dependency

### Patch Changes

- 6effd5d: fix(node): handle response cancellation correctly
- 3d54829: enhance: move W3C changes
- 0edf1f8: feat(cli): binds GraphQL Config to GraphQL Yoga
- a10a16c: Node Server implementation has been moved to `@graphql-yoga/node` package.

  CLI implementation has been moved to
  `graphql-yoga` package.

- 5b6f025: feat(yoga-cli): fallback to default schema and add mock parameter
- Updated dependencies [d414f95]
- Updated dependencies [133f8e9]
- Updated dependencies [14c93a7]
- Updated dependencies [ec777b1]
- Updated dependencies [dcaea56]
- Updated dependencies [b0b244b]
- Updated dependencies [cfec14b]
- Updated dependencies [433558f]
- Updated dependencies [3c82b57]
- Updated dependencies [f5f06f4]
- Updated dependencies [dcaea56]
- Updated dependencies [8ab60cf]
- Updated dependencies [433558f]
- Updated dependencies [5fba736]
- Updated dependencies [62e8c07]
- Updated dependencies [ce60a48]
- Updated dependencies [a8b619b]
- Updated dependencies [6d60ebf]
- Updated dependencies [44ad1b3]
- Updated dependencies [0424fe3]
- Updated dependencies [de1693e]
- Updated dependencies [d60f79f]
- Updated dependencies [dcaea56]
- Updated dependencies [daeea82]
- Updated dependencies [a10a16c]
  - @graphql-yoga/node@0.1.0

## 2.0.0-beta.8

### Minor Changes

- 6d60ebf: add tabs to GraphiQL

### Patch Changes

- 5b6f025: feat(yoga-cli): fallback to default schema and add mock parameter
- Updated dependencies [3c82b57]
- Updated dependencies [6d60ebf]
- Updated dependencies [0424fe3]
- Updated dependencies [d60f79f]
  - @graphql-yoga/node@0.1.0-beta.8

## 2.0.0-beta.7

### Patch Changes

- Updated dependencies [14c93a7]
- Updated dependencies [ec777b1]
- Updated dependencies [8ab60cf]
  - @graphql-yoga/node@0.1.0-beta.7

## 2.0.0-beta.6

### Patch Changes

- @graphql-yoga/node@0.1.0-beta.6

## 2.0.0-beta.5

### Patch Changes

- Updated dependencies [cfec14b]
- Updated dependencies [5fba736]
- Updated dependencies [44ad1b3]
  - @graphql-yoga/node@0.1.0-beta.5

## 2.0.0-beta.4

### Patch Changes

- Updated dependencies [433558f]
- Updated dependencies [433558f]
  - @graphql-yoga/node@0.1.0-beta.4

## 2.0.0-beta.3

### Patch Changes

- Updated dependencies [62e8c07]
  - @graphql-yoga/node@0.1.0-beta.3

## 2.0.0-beta.2

### Patch Changes

- Updated dependencies [daeea82]
  - @graphql-yoga/node@0.0.1-beta.2

## 2.0.0-beta.1

### Patch Changes

- @graphql-yoga/node@0.0.1-beta.1

## 2.0.0-beta.0

### Major Changes

- de1693e: trigger release

### Patch Changes

- Updated dependencies [de1693e]
  - @graphql-yoga/node@0.0.1-beta.0

## 2.0.0-alpha.12

### Minor Changes

- dcaea56: add missing tslib dependency

### Patch Changes

- Updated dependencies [133f8e9]
- Updated dependencies [dcaea56]
- Updated dependencies [f5f06f4]
- Updated dependencies [dcaea56]
- Updated dependencies [ce60a48]
- Updated dependencies [dcaea56]
  - @graphql-yoga/node@0.1.0-alpha.4

## 2.0.0-alpha.11

### Patch Changes

- @graphql-yoga/node@0.1.0-alpha.3

## 2.0.0-alpha.10

### Patch Changes

- Updated dependencies [b0b244b]
  - @graphql-yoga/node@0.1.0-alpha.2

## 2.0.0-alpha.9

### Patch Changes

- @graphql-yoga/node@0.1.0-alpha.1

## 2.0.0-alpha.8

### Minor Changes

- 6750eff: rename `GraphQLServerError` to `GraphQLYogaError`.
- d414f95: **BREAKING** Set `maskedErrors` value to `true` by default for safer defaults.

  **BREAKING** Remove `disableIntrospection`. [Please use `useDisableIntrospection` from `@envelop/disable-introspection` instead.](https://www.envelop.dev/plugins/use-disable-introspection)

- bea2dcc: align envelop types
- fc1f2c7: make options optional

### Patch Changes

- 6effd5d: fix(node): handle response cancellation correctly
- a10a16c: Node Server implementation has been moved to `@graphql-yoga/node` package.

  CLI implementation has been moved to
  `graphql-yoga` package.

- Updated dependencies [d414f95]
- Updated dependencies [a10a16c]
  - @graphql-yoga/node@0.1.0-alpha.0

## 2.0.0-alpha.7

### Patch Changes

- 3d54829: enhance: move W3C changes
- Updated dependencies [3d54829]
  - @graphql-yoga/common@0.2.0-alpha.6
  - @graphql-yoga/handler@0.2.0-alpha.3

## 2.0.0-alpha.6

### Minor Changes

- 36af58e: export renderGraphiQL function

### Patch Changes

- Updated dependencies [36af58e]
  - @graphql-yoga/common@0.2.0-alpha.5
  - @graphql-yoga/handler@0.2.0-alpha.2

## 2.0.0-alpha.5

### Patch Changes

- Updated dependencies [d2c2d18]
  - @graphql-yoga/common@0.2.0-alpha.4

## 2.0.0-alpha.4

### Minor Changes

- fb894da: Rename createGraphQLServer to createServer

### Patch Changes

- Updated dependencies [e99ec3e]
- Updated dependencies [fb894da]
  - @graphql-yoga/subscription@0.1.0-alpha.0
  - @graphql-yoga/common@0.2.0-alpha.3

## 2.0.0-alpha.3

### Minor Changes

- 0edf1f8: feat: options for GraphiQL
- 1a20e1e: Export everything from @envelop/core and export GraphQLFile scalar
- 9554f81: Add PubSub utility.
- 95e0ac0: feat: remove unnecessary Upload scalar types

### Patch Changes

- Updated dependencies [0edf1f8]
- Updated dependencies [95e0ac0]
  - @graphql-yoga/common@0.2.0-alpha.2
  - @graphql-yoga/handler@0.2.0-alpha.1

## 2.0.0-alpha.2

### Patch Changes

- Updated dependencies [5de1acf]
  - @graphql-yoga/common@0.2.0-alpha.1

## 2.0.0-alpha.1

### Minor Changes

- d078e84: Drop fastify and use node-http package

### Patch Changes

- Updated dependencies [d078e84]
- Updated dependencies [d8f8a81]
  - @graphql-yoga/common@0.2.0-alpha.0
  - @graphql-yoga/handler@0.2.0-alpha.0

## 2.0.0-alpha.0

### Major Changes

- b6dd3f1: The goal is to provide a fully-featured, simple to set up, performant and extendable server. Some key features:

  - [GraphQL-over-HTTP](https://github.com/graphql/graphql-over-http) spec compliant
  - Extend the GraphQL request flow using [`envelop`](https://www.envelop.dev/)
  - File uploads (via GraphQL multipart request specification)
  - GraphQL Subscriptions (using [SSE](https://github.com/enisdenjo/graphql-sse))
  - Logging using [Pino](https://github.com/pinojs/pino)
  - Improved TypeScript Support
  - Try out experimental GraphQL features such as `@defer` and `@stream`
