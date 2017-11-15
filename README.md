<p align="center"><img src="https://imgur.com/Sv6j0B6.png" width="100" /></p>

# graphql-yoga [![Build Status](https://travis-ci.org/graphcool/graphql-yoga.svg?branch=master)](https://travis-ci.org/graphcool/graphql-yoga) [![npm version](https://badge.fury.io/js/graphql-yoga.svg)](https://badge.fury.io/js/graphql-yoga) [![Greenkeeper badge](https://badges.greenkeeper.io/graphcool/graphql-yoga.svg)](https://greenkeeper.io/)

🧘 Fully-featured GraphQL Server with focus on easy setup, performance &amp; extensibility

## Install

```sh
yarn add graphql-yoga
```

## Usage

### API

```ts
import { GraphQLServer, PubSub } from './graphql-yoga'

const typeDefs = `
  type Query {
    hello: String!
  }

  type SubResult {
    count: Int!
    other: String
  }

  type Subscription {
    counter: SubResult!
  }
`

const resolvers = {
  Query: {
    hello: () => 'Hello world',
  },
  SubResult: {
    other: () => 'Hello Counter',
  },
  Subscription: {
    counter: {
      subscribe: (parent, args, { pubsub }) => {
        const channel = 'x'
        let i = 0
        setInterval(() => pubsub.publish(channel, { counter: { count: i++ } }), 2000)
        return pubsub.asyncIterator(channel)
      },
    }
  },
}

const pubsub = new PubSub()
const server = new GraphQLServer({ typeDefs, resolvers, context: { pubsub } })

server.start(3000, () => console.log('Server is running on localhost:3000'))
```
