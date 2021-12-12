<p align="center"><img src="https://imgur.com/Sv6j0B6.png" width="100" /></p>

# graphql-yoga

Fully-featured GraphQL Server with focus on easy setup, performance & great developer experience

You can try out the `alpha` release today and give us [feedback](https://github.com/dotansimha/graphql-yoga/issues/704)!.

We are working on documentation and examples for the `alpha` release. You can check them out https://graphql-yoga.vercel.app

### Installation

```shell
npm i graphql-yoga@alpha graphql
```

### Basic Usage

We are actively working on API for the library. This is a very simple example of how to use it:

```js
const { GraphQLServer } = require('graphql-yoga')
const { GraphQLSchema, GraphQLObjectType, GraphQLString } = require('graphql')

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: () => ({
      ping: {
        type: GraphQLString,
        resolve: () => 'pong',
      },
    }),
  }),
})
// Provide your schema
const server = new GraphQLServer({
  schema,
  isDev: process.env.NODE_ENV !== 'production',
})
// Start the server and explore http://localhost:4000/graphql
server.start()
```

## Overview

- **Easiest way to run a GraphQL server:** Sensible defaults & includes everything you need with minimal setup (we also export a platform/env-agnostic handler so you can build your own wrappers easily).
- **Includes Subscriptions:** Built-in support for GraphQL subscriptions using **S**erver-**S**ent **E**vents.
- **Compatible:** Works with all GraphQL clients (Apollo, Relay...) and fits seamless in your GraphQL workflow.
- **W3C Fetch API:** the core package depends on W3C Fetch API so it can run and deploy on any environment (Serverless, Workers, Deno, Node).  
- **Easily Extendable:** New GraphQL-Yoga support all `envelop`[https://www.envelop.dev] plugins. 

## Features

- GraphQL spec-compliant
- HTTP based on [`fastify`](https://fastify.io)
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

[![GitHub license](https://img.shields.io/badge/license-MIT-lightgrey.svg?maxAge=2592000)](https://raw.githubusercontent.com/apollostack/apollo-ios/master/LICENSE)

MIT
