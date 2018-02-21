# hello-world

This directory contains a simple "Hello World" example based on `graphql-yoga`.

## Get started

**Clone the repository:**

```sh
git clone https://github.com/graphcool/graphql-yoga.git
cd graphql-yoga/examples/hello-world
```

**Install dependencies and run the app:**

```sh
yarn install # or npm install
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
