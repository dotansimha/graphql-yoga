# firebase-function

This directory contains a simple "Hello World" example based on `graphql-yoga` deploy to firebase's functions.

## Get started

**Clone the repository:**

```sh
git clone https://github.com/graphcool/graphql-yoga/
cd graphql-yoga/examples/firebase-function/functions
```

**Install dependencies and run the app:**

```sh
yarn install # or npm install
yarn start   # or npm start
```
*PS*: You much install `firebase-tools` to deploy the example to firebase. Run `npm i -g firebase-tools`.

## Testing

Open your browser at your Function URL and start sending queries.

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
const functions = require('firebase-functions');
const { GraphQLServer } = require('graphql-yoga')

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
server.prepareStart(server.express, {});
 
// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions
exports.graphql = functions.https.onRequest(function (request, response) {
  if (!request.path) {
    request.url = `/${request.url}` // prepend '/' to keep query params if any
  }
  return server.express(request, response)
});
```
