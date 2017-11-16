<p align="center"><img src="https://imgur.com/Sv6j0B6.png" width="100" /></p>

# graphql-yoga

[![Build Status](https://travis-ci.org/graphcool/graphql-yoga.svg?branch=master)](https://travis-ci.org/graphcool/graphql-yoga) [![npm version](https://badge.fury.io/js/graphql-yoga.svg)](https://badge.fury.io/js/graphql-yoga) [![Greenkeeper badge](https://badges.greenkeeper.io/graphcool/graphql-yoga.svg)](https://greenkeeper.io/)

Fully-featured GraphQL Server with focus on easy setup, performance &amp; great developer experience

## Features

* **Easiest way to run a GraphQL server:** Good defaults & includes everything you need with minimal setup.
* **Includes Subscriptions:** Built-in support for GraphQL Subscriptions using WebSockets.
* **Compatible:** Works with all GraphQL clients (Apollo, Relay...) and fits seamless in your GraphQL workflow.

`graphql-yoga` is based on the following libraries & tools:

  * [`express`](https://github.com/expressjs/express)/[`apollo-server`](https://github.com/apollographql/apollo-server): Performant, extensible web server framework
  * [`graphql-subscriptions`](https://github.com/apollographql/graphql-subscriptions)/[`subscriptions-transport-ws`](https://github.com/apollographql/subscriptions-transport-ws): GraphQL subscriptions server
  * [`graphql.js`](https://github.com/graphql/graphql-js)/[`graphql-tools`](https://github.com/apollographql/graphql-tools): GraphQL engine & schema helpers
  * [`graphql-playground`](https://github.com/graphcool/graphql-playground): Interactive GraphQL IDE

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
server.start(() => console.log('Server is running on localhost:3000'))
```

> To get started with `graphql-yoga`, follow the instructions in the READMEs of the [examples](./examples). 

### API

#### `GraphQLServer`

##### `constructor(props: Props): GraphQLServer`

The `props` argument accepts the following fields:

- `typeDefs`: A **string** containing GraphQL type definitions in [SDL](https://blog.graph.cool/graphql-sdl-schema-definition-language-6755bcb9ce51)
- `resolvers`: An **object** containing resolvers for the fields specified in `typeDefs`
- `schema`: An **instance of [`GraphQLSchema`](http://graphql.org/graphql-js/type/#graphqlschema)**
- `context`: An **object** containing custom data being passed through your resolver chain 
- `options`: See below

Note that you have two major ways of providing the [schema](https://blog.graph.cool/graphql-server-basics-the-schema-ac5e2950214e) information to the `constructor`:

- Provide `typeDefs` and `resolvers` and omit the `schema`, in this case `graphql-yoga` will construct the `GraphQLSchema` instance for you under the hood. 
- Provide `schema` and omit `typeDefs` and `resolvers`.

The `options` object has the following fields:

- `cors`: An **object** containing [configuration options](https://github.com/expressjs/cors#configuration-options) for [cors](https://github.com/expressjs/cors) **(default: `undefined`)**
- `disableSubscriptions`: A **boolean** indicating where subscriptions should be en- or disabled for your server **(default: `false`)**
- `port`: An **integer** determining the port your server will be listening on **(default: `4000`)**; note that you can also specify the port by setting the `PORT` environment variable
- `endpoint`: A **string** that defines the HTTP endpoint of your server **(default: `'/'`)**
- `subscriptionsEndpoint`: A **string** that defines the subscriptions (websocket) endpoint for your server **(default: `'/'`)**
- `playgroundEndpoint`: A **string** that defines the endpoint where you can invoke the Playground **(default: `'/'`)**
- `disablePlayground`: A **boolean** indicating whether the Playground should be enabled **(default: `false`)**

Here is example of creating a new server:

```js
const options = {
  disableSubscriptions: false,  // same as default value
  port: 8000,
  endoint: '/graphql',
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

Once your `graphql-yoga` server is running, you can test it with a [GraphQL Playground](https://github.com/graphcool/graphql-playground):

[![](https://imgur.com/6IC6Huj.png)](https://www.graphqlbin.com/RVIn)

## Deployment

### `now`

To deploy your `graphql-yoga` server with [`now`](https://zeit.co/now), follow these instructions:

1. Download [**Now Desktop**](https://zeit.co/download) 
2. Navigate to the root directory of your `graphql-yoga` server
3. Run `now` in your terminal

### `up` (Coming soon 🔜 )

### Heroku (Coming soon 🔜 )

### AWS Lambda (Coming soon 🔜 )

## FAQ

### How does `graphql-yoga` compare to `apollo-server` and other tools?

As mentioned above, `graphql-yoga` is built on top of a variety of other packages, such as `graphql.js`, `express` and  `apollo-server`. Each of these provide a certain piece of functionality required for building a GraphQL server.

Using these packages individually incurs overhead in the setup process and requires you to write a lot of boilerplate. `graphql-yoga` abstracts away the initial complexity and required boilerplate and let's you get started quickly with a set of sensible defaults for your server configuration.

`graphql-yoga` is like [`create-react-app`](https://github.com/facebookincubator/create-react-app) for building GraphQL servers.

### Can't I just setup my own GraphQL server using `express` and `graphql.js`?

`graphql-yoga` is all about convenience and a great "Getting Started"-experience by abstracting away the complexity that comes when you're building your own GraphQL from scratch. It's a pragmatic approach to bootstrap a GraphQL server, much like [`create-react-app`](https://github.com/facebookincubator/create-react-app) removes friction when first starting out with React.

Whenever the defaults of `graphql-yoga` are too tight of a corset for you, you can simply _eject_ from it and use the tooling it's build upon - there's no lock-in or any other kind of magic going on preventing you from this.
