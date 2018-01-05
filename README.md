<p align="center"><img src="https://imgur.com/Sv6j0B6.png" width="100" /></p>

# graphql-yoga

[![CircleCI](https://circleci.com/gh/graphcool/graphql-yoga.svg?style=shield)](https://circleci.com/gh/graphcool/graphql-yoga) [![npm version](https://badge.fury.io/js/graphql-yoga.svg)](https://badge.fury.io/js/graphql-yoga)

Fully-featured GraphQL Server with focus on easy setup, performance &amp; great developer experience

## Overview

* **Easiest way to run a GraphQL server:** Good defaults & includes everything you need with minimal setup.
* **Includes Subscriptions:** Built-in support for GraphQL Subscriptions using WebSockets.
* **Compatible:** Works with all GraphQL clients (Apollo, Relay...) and fits seamless in your GraphQL workflow.

`graphql-yoga` is based on the following libraries & tools:

  * [`express`](https://github.com/expressjs/express)/[`apollo-server`](https://github.com/apollographql/apollo-server): Performant, extensible web server framework
  * [`graphql-subscriptions`](https://github.com/apollographql/graphql-subscriptions)/[`subscriptions-transport-ws`](https://github.com/apollographql/subscriptions-transport-ws): GraphQL subscriptions server
  * [`graphql.js`](https://github.com/graphql/graphql-js)/[`graphql-tools`](https://github.com/apollographql/graphql-tools): GraphQL engine & schema helpers
  * [`graphql-playground`](https://github.com/graphcool/graphql-playground): Interactive GraphQL IDE

## Features

* GraphQL spec-compliant
* File upload
* GraphQL Subscriptions
* TypeScript typings
* GraphQL Playground
* Extensible via Express middlewares
* Apollo Tracing
* Accepts both `application/json` and `application/graphql` content-type

## Install

```sh
yarn add graphql-yoga
```

## Usage

### Quickstart ([Hosted demo](https://hello-world-myitqprcqm.now.sh))

```ts
import { GraphQLServer } from 'graphql-yoga'
// ... or using `require()`
// const { GraphQLServer } = require('graphql-yoga')

const typeDefs = `
  type Query {
    hello(name: String): String!
  }
`

const resolvers = {
  Query: {
    hello: (_, { name }) => `Hello ${name || 'World'}`,
  },
}

const server = new GraphQLServer({ typeDefs, resolvers })
server.start(() => console.log('Server is running on localhost:4000'))
```

> To get started with `graphql-yoga`, follow the instructions in the READMEs of the [examples](./examples). 

### API

#### `GraphQLServer`

##### `constructor(props: Props): GraphQLServer`

The `props` argument accepts the following fields:

| Key | Type | Default | Note |
| ---  | --- | --- | --- |
| `typeDefs` | String  |  `null` | Contains GraphQL type definitions in [SDL](https://blog.graph.cool/graphql-sdl-schema-definition-language-6755bcb9ce51) or file path to type definitions (required if `schema` is not provided \*)  |
| `resolvers`  | Object  |  `null`  | Contains resolvers for the fields specified in `typeDefs` (required if `schema` is not provided \*) |
| `schema`  | Object |  `null`  | An instance of [`GraphQLSchema`](http://graphql.org/graphql-js/type/#graphqlschema) (required if `typeDefs` and `resolvers` are not provided \*) |
| `context`  | Object  |  `{}`  | Contains custom data being passed through your resolver chain  |
| `options`  | Object  |  `{}`  | See below |

<!--
- `typeDefs`: A **string** containing GraphQL type definitions in [SDL](https://blog.graph.cool/graphql-sdl-schema-definition-language-6755bcb9ce51) (required if `schema` is not provided *)
- `resolvers`: An **object** containing resolvers for the fields specified in `typeDefs` (required if `schema` is not provided *)
- `schema`: An **instance of [`GraphQLSchema`](http://graphql.org/graphql-js/type/#graphqlschema)** (required if `typeDefs` and `resolvers` are not provided *)
- `context`: An **object** containing custom data being passed through your resolver chain
- `options`: See below
-->

> (*) There are two major ways of providing the [schema](https://blog.graph.cool/graphql-server-basics-the-schema-ac5e2950214e) information to the `constructor`:
> 
> 1. Provide `typeDefs` and `resolvers` and omit the `schema`, in this case `graphql-yoga` will construct the `GraphQLSchema` instance using [`makeExecutableSchema`](https://www.apollographql.com/docs/graphql-tools/generate-schema.html#makeExecutableSchema) from [`graphql-tools`](https://github.com/apollographql/graphql-tools).
> 2. Provide the `schema` directly and omit `typeDefs` and `resolvers`.

The `options` object has the following fields:

| Key | Type | Default | Note |
| ---  | --- | --- | --- |
| `cors` | Object |  `null` | Contains [configuration options](https://github.com/expressjs/cors#configuration-options) for [cors](https://github.com/expressjs/cors) |
| `disableSubscriptions`  | Boolean  |  `false`  | Indicates whether subscriptions should be en- or disabled for your server |
| `tracing`  | Boolean or String  |  `false`  | Indicates whether [Apollo Tracing](https://github.com/apollographql/apollo-tracing) should be en- or disabled for your server (if a string is provided, accepted values are: `'enabled'`, `'disabled'`, `'http-header'`) |
| `port`  | Number |  `4000 `  | Determines the port your server will be listening on (note that you can also specify the port by setting the `PORT` environment variable) |
| `endpoint`  | String  |  `'/'`  | Defines the HTTP endpoint of your server |
| `subscriptionsEndpoint` | String  |  `'/'`  | Defines the subscriptions (websocket) endpoint for your server |
| `playgroundEndpoint` | String  |  `'/'`  | Defines the endpoint where you can invoke the [Playground](https://github.com/graphcool/graphql-playground) |
| `disablePlayground` | Boolean  |  `false`  | Indicates whether the Playground should be enabled |
| `uploads` | Object  | `null`  | Provides information about upload limits; the object can have any combination of the following three keys: `maxFieldSize`, `maxFileSize`, `maxFiles`; each of these have values of type Number |


<!--
- `cors`: An **object** containing [configuration options](https://github.com/expressjs/cors#configuration-options) for [cors](https://github.com/expressjs/cors) **(default: `undefined`)**.
- `disableSubscriptions`: A **boolean** indicating where subscriptions should be en- or disabled for your server **(default: `false`)**.
- `port`: An **integer** determining the port your server will be listening on **(default: `4000`)**; note that you can also specify the port by setting the `PORT` environment variable.
- `endpoint`: A **string** that defines the HTTP endpoint of your server **(default: `'/'`)**.
- `subscriptionsEndpoint`: A **string** that defines the subscriptions (websocket) endpoint for your server **(default: `'/'`)**.
- `playgroundEndpoint`: A **string** that defines the endpoint where you can invoke the Playground **(default: `'/'`)**.
- `disablePlayground`: A **boolean** indicating whether the Playground should be enabled **(default: `false`)**.
-->


Here is example of creating a new server:

```js
const options = {
  disableSubscriptions: false,  // same as default value
  port: 8000,
  endpoint: '/graphql',
  subscriptionsEndpoint: '/subscriptions',
  playgroundEndpoint: '/playground',
  disablePlayground: false      // same as default value
}

const typeDefs = `
  type Query {
    hello(name: String): String!
  }
`

const resolvers = {
  Query: {
    hello: (_, { name }) => `Hello ${name || 'World'}`,
  },
}

const server = new GraphQLServer({ typeDefs, resolvers, options })
```

#### `start(callback: (() => void) = (() => null)): Promise<void>`

Once your `GraphQLServer` is instantiated, you can call the `start` method on it. It takes one argument `callback`, a function that's invoked right before the server is started. As an example, the `callback` can be used to print information that the server was now started:

```js
server.start(() => console.log(`Server started, listening on port 8000 for incoming requests.`))
```

#### `PubSub`

See the original documentation in [`graphql-subscriptions`](https://github.com/apollographql/graphql-subscriptions).

### Endpoints

## Examples

There are three examples demonstrating how to quickly get started with `graphql-yoga`:

- [hello-world](./examples/hello-world): Basic setup for building a schema and allowing for a `hello` query.
- [subscriptions](./examples/subscriptions): Basic setup for using subscriptions with a counter that increments every 2 seconds and triggers a subscriptions.
- [fullstack](./examples/fullstack): Fullstack example based on [`create-react-app`](https://github.com/facebookincubator/create-react-app) demonstrating how to query data from `graphql-yoga` with [Apollo Client 2.0](https://www.apollographql.com/client/).

## Workflow

Once your `graphql-yoga` server is running, you can use [GraphQL Playground](https://github.com/graphcool/graphql-playground) out of the box – typically running on `localhost:4000`. (Read [here](https://blog.graph.cool/introducing-graphql-playground-f1e0a018f05d) for more information.)

[![](https://imgur.com/6IC6Huj.png)](https://www.graphqlbin.com/RVIn)

## Deployment

### `now`

To deploy your `graphql-yoga` server with [`now`](https://zeit.co/now), follow these instructions:

1. Download [**Now Desktop**](https://zeit.co/download) 
2. Navigate to the root directory of your `graphql-yoga` server
3. Run `now` in your terminal

### Heroku

To deploy your `graphql-yoga` server with [Heroku](https://heroku.com), follow these instructions:

1. Download and install the [Heroku Command Line Interface](https://devcenter.heroku.com/articles/heroku-cli#download-and-install) (previously Heroku Toolbelt)
2. Log In to the Heroku CLI with `heroku login`
3. Navigate to the root directory of your `graphql-yoga` server
4. Create the Heroku instance by executing `heroku create`
5. Deploy your GraphQL server by executing `git push heroku master`

### `up` (Coming soon 🔜 )

### AWS Lambda (Coming soon 🔜 )

## FAQ

### How does `graphql-yoga` compare to `apollo-server` and other tools?

As mentioned above, `graphql-yoga` is built on top of a variety of other packages, such as `graphql.js`, `express` and  `apollo-server`. Each of these provide a certain piece of functionality required for building a GraphQL server.

Using these packages individually incurs overhead in the setup process and requires you to write a lot of boilerplate. `graphql-yoga` abstracts away the initial complexity and required boilerplate and let's you get started quickly with a set of sensible defaults for your server configuration.

`graphql-yoga` is like [`create-react-app`](https://github.com/facebookincubator/create-react-app) for building GraphQL servers.

### Can't I just setup my own GraphQL server using `express` and `graphql.js`?

`graphql-yoga` is all about convenience and a great "Getting Started"-experience by abstracting away the complexity that comes when you're building your own GraphQL from scratch. It's a pragmatic approach to bootstrap a GraphQL server, much like [`create-react-app`](https://github.com/facebookincubator/create-react-app) removes friction when first starting out with React.

Whenever the defaults of `graphql-yoga` are too tight of a corset for you, you can simply _eject_ from it and use the tooling it's build upon - there's no lock-in or any other kind of magic going on preventing you from this.

### How to eject from the standard `express` setup?

The core value of `graphql-yoga` is that you don't have to write the boilerplate required to configure your [express.js](https://github.com/expressjs/) application. However, once you need to add more customized behaviour to your server, the default configuration provided by `graphql-yoga` might not suit your use case any more. For example, it might be the case that you want to add more custom _middleware_ to your server, like for logging or error reporting.

For these cases, `GraphQLServer` exposes the `express.Application` directly via its [`express`](./src/index.ts#L17) property:
```js
server.express.use(myMiddleware())
```
Middlewares can also be added specifically to the GraphQL endpoint route, by using:
```js
server.express.post(server.options.endpoint, myMiddleware())
```
Any middlewares you add to that route, will be added right before the `apollo-server-express` middleware.

## Help & Community [![Slack Status](https://slack.graph.cool/badge.svg)](https://slack.graph.cool)

Join our [Slack community](http://slack.graph.cool/) if you run into issues or have questions. We love talking to you!

[![](http://i.imgur.com/5RHR6Ku.png)](https://www.graph.cool/)

