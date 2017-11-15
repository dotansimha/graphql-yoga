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
import { GraphQLServer } from './graphql-yoga'
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

#### `PubSub`

### Endpoints

## Examples

## Workflow


[![](https://imgur.com/6IC6Huj.png)](https://www.graphqlbin.com/RVIn)

## Deployment

### `now`

### `up`

### Heroku

### AWS Lambda

## FAQ

### How does `graphql-yoga` compare to `apollo-server` and other tools?

As mentioned above, `graphql-yoga` is built on top of a variety of other packages, such as `graphql.js`, `express` and  `apollo-server`. Each of these provide a certain piece of functionality required for building a GraphQL server.

Using these packages individually incurs overhead in the setup process and requires you to write a lot of boilerplate. `graphql-yoga` abstracts away the initial complexity and required boilerplate and let's you get started quickly with a set of sensible defaults for your server configuration. 

**`graphql-yoga` is the [`create-react-app`](https://github.com/facebookincubator/create-react-app) for building GraphQL servers.**

### Can't I just setup my own GraphQL server using `express` and `graphql.js`?

* 80:20 rule
* create-react-app
* just "eject" when you need to
