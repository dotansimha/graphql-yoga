<p align="center"><img src="./website/public/banner.svg" width="350" /></p>

# graphql-yoga

Fully-featured GraphQL Server with focus on easy setup, performance & great developer experience

[Read the docs](https://www.graphql-yoga.com)

### Installation

```shell
npm i @graphql-yoga/node graphql
```

### Basic Usage

This is a very simple example of how to use it:

```js
const { createServer } = require('@graphql-yoga/node')

// Provide your schema
const server = createServer({
  schema: {
    typeDefs: `
      type Query {
        ping: String
      }
    `,
    resolvers: {
      Query: {
        ping: () => 'pong',
      },
    },
  },
})

// Start the server and explore http://localhost:4000/graphql
server.start()
```

## Overview

- **Easiest way to run a GraphQL server:** Sensible defaults & includes everything you need with minimal setup (we also export a platform/env-agnostic handler so you can build your own wrappers easily).
- **Includes Subscriptions:** Built-in support for GraphQL subscriptions using **S**erver-**S**ent **E**vents.
- **Compatible:** Works with all GraphQL clients (Apollo, Relay...) and fits seamless in your GraphQL workflow.
- **WHATWG Fetch API:** the core package depends on [WHATWG Fetch API](https://fetch.spec.whatwg.org/) so it can run and deploy on any environment (Serverless, Workers, Deno, Node).
- **Easily Extendable:** New GraphQL-Yoga support all [`envelop`](https://www.envelop.dev) plugins.

## Features

- GraphQL spec-compliant
- TypeScript
- File upload
- Realtime capabilities
- Accepts both `application/json` and `application/graphql` content-types
- Supports ESM
- Runs everywhere: Can be deployed via `now`, `up`, AWS Lambda, Heroku etc.

### Contributing

If this is your first time contributing to this project, please do read our [Contributor Workflow Guide](https://github.com/the-guild-org/Stack/blob/master/CONTRIBUTING.md) before you get started off.

Feel free to open issues and pull requests. We're always welcome support from the community.

### Code of Conduct

Help us keep Yoga open and inclusive. Please read and follow our [
of Conduct](https://github.com/the-guild-org/Stack/blob/master/CODE_OF_CONDUCT.md) as adopted from [Contributor Covenant](https://www.contributor-covenant.org/)

### License

[![GitHub license](https://img.shields.io/badge/license-MIT-lightgrey.svg?maxAge=2592000)](https://raw.githubusercontent.com/dotansimha/graphql-yoga/master/LICENSE)

MIT
