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
import { GraphQLServer } from './graphql-yoga'
import { Engine } from 'apollo-engine'
// ... or using `require()`
// const { GraphQLServer } = require('graphql-yoga')
// const { Engine } = require('apollo-engine')

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

const engine = new Engine({
  engineConfig: { apiKey: process.env.APOLLO_ENGINE_KEY },
  endpoint: '/',
  graphqlPort: parseInt(process.env.Port, 10) || 4000,
})
engine.start();

server.express.use(engine.expressMiddleware())

server.start(() => console.log('Server is running on localhost:4000'))
```
