# subscriptions

This directory contains a simple GraphQL subscriptions example based on `graphql-yoga`.

## Get started

**Clone the repository:**

```sh
git clone https://github.com/graphcool/graphql-yoga.git
cd graphql-yoga/examples/subscriptions
```

**Install dependencies and run the app:**

```sh
yarn install # or npm install
yarn start   # or npm start
```

## Testing

Open your browser at [http://localhost:4000](http://localhost:4000) and start a subscription.

Paste the following subscription in the editor (left side) of the Playground:

```graphql
subscription {
  counter {
    count
    countStr
  }
}
```

The counter will increment every two seconds and the corresponding data is received in the Playground:

```json
{
  "data": {
    "counter": {
      "count": 1,
      "countStr": "Current count: 1"
    }
  }
}
// ... 2 seconds
{
  "data": {
    "counter": {
      "count": 2,
      "countStr": "Current count: 2"
    }
  }
}
// ... 2 seconds
{
  "data": {
    "counter": {
      "count": 3,
      "countStr": "Current count: 3"
    }
  }
}
// ...
```

## Implementation

This is what the [implementation](./index.js) looks like:

```js
const { GraphQLServer, PubSub } = require('graphql-yoga')

const typeDefs = `
  type Query {
    hello: String!
  }

  type Counter {
    count: Int!
    countStr: String
  }

  type Subscription {
    counter: Counter!
  }
`

const resolvers = {
  Query: {
    hello: () => `Hello`,
  },
  Counter: {
    countStr: counter => `Current count: ${counter.count}`,
  },
  Subscription: {
    counter: {
      subscribe: (parent, args, { pubsub }) => {
        const channel = Math.random().toString(36).substring(2, 15) // random channel name
        let count = 0
        setInterval(() => pubsub.publish(channel, { counter: { count: count++ } }), 2000)
        return pubsub.asyncIterator(channel)
      },
    }
  },
}

const pubsub = new PubSub()
const server = new GraphQLServer({ typeDefs, resolvers, context: { pubsub } })

server.start(() => console.log('Server is running on localhost:4000'))
```
