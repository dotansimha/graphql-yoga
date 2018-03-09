# apollo-engine

This directory contains the "Hello World" example based on `graphql-yoga`, extended with Apollo Engine. 

## Get started

**Clone the repository:**

```sh
git clone https://github.com/graphcool/graphql-yoga.git
cd graphql-yoga/examples/apollo-engine
```

**Install dependencies**

```sh
yarn install # or npm install
yarn start   # or npm start
```

**Set the `APOLLO_ENGINE_KEY` environment variable**

```sh
export APOLLO_ENGINE_KEY=.... # on Linux/Mac
set APOLLO_ENGINE_KEY=....    # on Windows
```

**Run the app**

```sh
yarn start   # or npm start
```

## Testing

Open your browser at [http://localhost:4000](http://localhost:4000) and start sending queries.

**Query without `name` argument:**

```graphql
query {
  hello
}
```

The server returns the following response:

```json
{
  "data": {
    "hello": "Hello World"
  }
}
```

**Query with `name` argument:**

```graphql
query {
  hello(name: "Sarah")
}
```

The server returns the following response:

```json
{
  "data": {
    "hello": "Hello Sarah"
  }
}
```

## Implementation

This is what the [implementation](./index.js) looks like:

```js
const { GraphQLServer } = require('graphql-yoga')
const compression = require('compression')

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

// Enable gzip compression
// ref: https://www.apollographql.com/docs/engine/setup-node.html#enabling-compression
server.express.use(compression())

server.start({
  apolloEngine: process.env.APOLLO_ENGINE_KEY,
  tracing: true,
  cacheControl: true
}, () => console.log('Server is running on localhost:4000'))
```
