<div align="center"><img src="./website/public/cover.png" width="720" /></div>

<div align="center">
  <h3>GraphQL Yoga</h3>
  <h6>Fully-featured GraphQL Server with focus on easy setup, performance & great developer experience</h6>
  <a href="https://www.the-guild.dev/graphql/yoga-server/v3"><b>Go to documenation</b></a>
</div>

<br />

<div align="center">

![npm](https://badgen.net/npm/v/graphql-yoga)
![bundlephobia minified size](https://badgen.net/bundlephobia/min/graphql-yoga)
![bundlephobia minified+zipped size](https://badgen.net/bundlephobia/minzip/graphql-yoga)
![bundlephobia treeshaking](https://badgen.net/bundlephobia/tree-shaking/graphql-yoga)
![license](https://badgen.net/github/license/dotansimha/graphql-yoga)

</div>

## Quick start

### Install

```sh
pnpm add graphql-yoga graphql
```

### Start

Make a schema, create Yoga and start a Node server:

```ts
import { createSchema, createYoga } from 'graphql-yoga'
import { createServer } from 'node:http'

const yoga = createYoga({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        hello: String
      }
    `,
    resolvers: {
      Query: {
        hello: () => 'Hello from Yoga!'
      }
    }
  })
})

const server = createServer(yoga)

server.listen(4000, () => {
  console.info('Server is running on http://localhost:4000/graphql')
})
```

## Overview

- **Easiest way to run a GraphQL server:** Sensible defaults & includes everything you need with minimal setup (we also export a platform/env-agnostic handler so you can build your own wrappers easily).
- **Includes Subscriptions:** Built-in support for GraphQL subscriptions using [**S**erver-**S**ent **E**vents](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events).
- **Compatible:** Works with all GraphQL clients ([Apollo](https://www.apollographql.com/docs/react/), [Relay](https://relay.dev/), [Urql](https://formidable.com/open-source/urql/)...) and fits seamless in your GraphQL workflow.
- **WHATWG Fetch API:** the core package depends on [WHATWG Fetch API](https://fetch.spec.whatwg.org/) so it can run and deploy on any environment (Serverless, Workers, Deno, Node).
- **Easily Extendable:** New GraphQL-Yoga support all [`envelop`](https://www.envelop.dev) plugins.

## [Features](https://www.the-guild.dev/graphql/yoga-server/v3)

- Fully typed with [TypeScript](https://www.typescriptlang.org)
- [GraphQL over HTTP spec compliant](https://github.com/enisdenjo/graphql-http/tree/master/implementations/graphql-yoga)
- [GraphiQL included](https://www.the-guild.dev/graphql/yoga-server/v3/features/graphiql)
- [File uploads with GraphQL Multipart Request spec](https://www.the-guild.dev/graphql/yoga-server/v3/features/file-uploads)
- [Subscriptions and realtime capabilities](https://www.the-guild.dev/graphql/yoga-server/v3/features/subscriptions)
- [Automatic persisted queries](https://www.the-guild.dev/graphql/yoga-server/v3/features/automatic-persisted-queries)
- [Built-in parsing and validation caching](https://www.the-guild.dev/graphql/yoga-server/v3/features/parsing-and-validation-caching)
- [Testing utilities](https://www.the-guild.dev/graphql/yoga-server/v3/features/testing)
- Supports [ESM](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- Runs **everywhere**, including environments like:
  - [Deno](https://www.the-guild.dev/graphql/yoga-server/v3/integrations/integration-with-deno)
  - [Bun](https://www.the-guild.dev/graphql/yoga-server/v3/integrations/integration-with-bun)
  - [Cloudflare Workers](https://www.the-guild.dev/graphql/yoga-server/v3/integrations/integration-with-cloudflare-workers)
  - [AWS Lambda](https://www.the-guild.dev/graphql/yoga-server/v3/integrations/integration-with-aws-lambda)
  - [_And other..._](https://www.the-guild.dev/graphql/yoga-server/v3/integrations/z-other-environments)
- [_And more..._](https://www.the-guild.dev/graphql/yoga-server/v3)

## [Documentation](https://www.the-guild.dev/graphql/yoga-server/v3)

Our [documentation website](https://www.the-guild.dev/graphql/yoga-server/v3) will help you get started.

## [Examples](https://github.com/dotansimha/graphql-yoga/tree/main/examples)

We've made sure developers can quickly start with GraphQL Yoga by providing a comprehensive set of examples. [See all of them in the `examples/` folder.](https://github.com/dotansimha/graphql-yoga/tree/main/examples)

## [Comparison](https://www.the-guild.dev/graphql/yoga-server/v3/comparison)

Read more about how GraphQL Yoga compares to other servers in the ecosystem [here](https://www.the-guild.dev/graphql/yoga-server/v3/comparison).

## Contributing

If this is your first time contributing to this project, please do read our [Contributor Workflow Guide](https://github.com/the-guild-org/Stack/blob/master/CONTRIBUTING.md) before you get started off.

Feel free to open issues and pull requests. We're always welcome support from the community.

## Code of Conduct

Help us keep Yoga open and inclusive. Please read and follow our [Code of Conduct](https://github.com/the-guild-org/Stack/blob/master/CODE_OF_CONDUCT.md) as adopted from [Contributor Covenant](https://www.contributor-covenant.org/).

## License

MIT
