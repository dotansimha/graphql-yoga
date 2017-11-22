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
  * [`apollo-upload-server`](https://github.com/jaydenseric/apollo-upload-server): File uploads via queries or mutations
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
server.start(() => console.log('Server is running on localhost:4000'))
```

> To get started with `graphql-yoga`, follow the instructions in the READMEs of the [examples](./examples). 

## API

### `new GraphQLServer()`

> Type Signature: `constructor(props: Props): GraphQLServer`

```ts
import { GraphQLServer } from 'graphql-yoga'

const server = new GraphQLServer({
  typeDefs,
  resolvers,
  options: {
    port: 4000,
  },
})
```

Here is a list of all argument fields:

#### `typeDefs`
A string containing GraphQL type definitions in [SDL](https://blog.graph.cool/graphql-sdl-schema-definition-language-6755bcb9ce51) (required if `schema` is not provided)

#### `resolvers`
An object containing resolvers for the fields specified in `typeDefs` (required if `schema` is not provided). Uses [`makeExecutableSchema`](https://www.apollographql.com/docs/graphql-tools/generate-schema.html#makeExecutableSchema) from [`graphql-tools`](https://github.com/apollographql/graphql-tools).

#### `schema`
An **instance of [`GraphQLSchema`](http://graphql.org/graphql-js/type/#graphqlschema)** (required if `typeDefs` and `resolvers` are not provided)

#### `context`
An **object** or **function** containing custom data being passed through your resolver chain

The function has the following signature: `({ request?: Request, connection?: SubscriptionOptions }) => any`

- `request` is the HTTP request object which is provided for normal HTTP requests (queries/mutations)
- `connection` is the [connection object](https://github.com/apollographql/subscriptions-transport-ws/blob/master/src/client.ts#L31) provided for new subscriptions

> Note that there is always either the `request` *or* the `connection` argument provided.


#### `options`
The `options` object has the following fields:

- `cors`: An **object** containing [configuration options](https://github.com/expressjs/cors#configuration-options) for [cors](https://github.com/expressjs/cors). Provide `false` to disable. **(default: `undefined`)**.
- `disableSubscriptions`: A **boolean** indicating where subscriptions should be en- or disabled for your server **(default: `false`)**.
- `port`: An **integer** determining the port your server will be listening on **(default: `4000`)**; note that you can also specify the port by setting the `PORT` environment variable.
- `endpoint`: A **string** that defines the HTTP endpoint of your server **(default: `'/'`)**.
- `subscriptionsEndpoint`: A **string** that defines the subscriptions (websocket) endpoint for your server **(default: `'/'`)**.
- `playgroundEndpoint`: A **string** that defines the endpoint where you can invoke the Playground **(default: `'/'`)**.
- `disablePlayground`: A **boolean** indicating whether the Playground should be enabled **(default: `false`)**.
- `uploads`: An **object** containing [configuration options](https://github.com/jaydenseric/apollo-upload-server#options) for [apollo-upload-server](https://github.com/jaydenseric/apollo-upload-server).

### `GraphQLServer.start()`

> Type Signature: `start(callback?: (() => void)): Promise<void>`

```ts
// this starts the HTTP and WebSocket server
server.start()

// you can also provide a callback (e.g. for logging)
server.start(() => console.log('Server is running on localhost:4000'))
```

### `GraphQLServer.express`

> Type Signature: `express: express.Application`

You can easily access (and modify) the underlying Express application using the exposed `express` property. Here is a simple example:

```ts
server.express.use(myMiddleware())
```


### `PubSub`

`PubSub` can be used to implement subscriptions and has a simple publish-subscribe API:

```ts
import { PubSub } from 'graphql-yoga'

// simply instantiate a new PubSub object ...
const pubsub = new PubSub()
const SOMETHING_CHANGED_TOPIC = 'something_changed';

const resolvers = {
  Subscription: {
    somethingChanged: {
      // ... implement the `subscribe` method in your subscription resolvers ...
      subscribe: () => pubsub.asyncIterator(SOMETHING_CHANGED_TOPIC),
    },
  },
}

// ... and from somewhere publish events
setInterval(
  () => pubsub.publish(SOMETHING_CHANGED_TOPIC, { somethingChanged: { id: "123" }}),
  2000
)
```

For more information see the original documentation in [`graphql-subscriptions`](https://github.com/apollographql/graphql-subscriptions).

### Endpoints

`graphql-yoga` by default exposes an HTTP and WebSocket endpoint on `localhost:4000/`. (Can be adjusted in the constructor options.)

Once your `graphql-yoga` server is running, you can use [GraphQL Playground](https://github.com/graphcool/graphql-playground) out of the box. (Read [here](https://blog.graph.cool/introducing-graphql-playground-f1e0a018f05d) for more information.)

[![](https://imgur.com/6IC6Huj.png)](https://www.graphqlbin.com/RVIn)

## Examples

There are three examples demonstrating how to quickly get started with `graphql-yoga`:

- [hello-world](./examples/hello-world): Basic setup for building a schema and allowing for a `hello` query.
- [subscriptions](./examples/subscriptions): Basic setup for using subscriptions with a counter that increments every 2 seconds and triggers a subscriptions.
- [fullstack](./examples/fullstack): Fullstack example based on [`create-react-app`](https://github.com/facebookincubator/create-react-app) demonstrating how to query data from `graphql-yoga` with [Apollo Client 2.0](https://www.apollographql.com/client/).


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

### How to eject from the standard `express` setup?

The core value of `graphql-yoga` is that you don't have to write the boilerplate required to configure your [express.js](https://github.com/expressjs/) application. However, once you need to add more customized behaviour to your server, the default configuration provided by `graphql-yoga` might not suit your use case any more. For example, it might be the case that you want to add more custom _middleware_ to your server, like for logging or error reporting.

For these cases, `GraphQLServer` exposes the `express.Application` directly via its [`express`](./src/index.ts#L17) property:

```js
server.express.use(myMiddleware())
```


## Help & Community [![Slack Status](https://slack.graph.cool/badge.svg)](https://slack.graph.cool)

Join our [Slack community](http://slack.graph.cool/) if you run into issues or have questions. We love talking to you!

[![](http://i.imgur.com/5RHR6Ku.png)](https://www.graph.cool/)
