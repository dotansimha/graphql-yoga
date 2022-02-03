# Modular Resolvers and TypeDefs

This `graphql-yoga` example written in Typescript illustrates how you can have complete freedom
over the structure of your **typeDef** and **resolver** files by using the
[`merge-graphql-schemas` utility library](https://github.com/okgrow/merge-graphql-schemas).

## Get Started

**Clone the repository:**

```sh
git clone https://github.com/graphcool/graphql-yoga.git
cd graphql-yoga/examples/modular-resolvers
```

**Install dependencies and run the app:**

```sh
npm install # or yarn install
npm start   # or yarn start
```

## Run the Queries

Open your browser at [http://localhost:4004](http://localhost:4004) and start sending queries in the Playground.

**In the left pane, run the `welcome` Query:**

```graphql
{
  welcome(yourNickname: "Superstar")
}
```

The server returns the following response:

```json
{
  "data": {
    "welcome": "Welcome, Superstar!"
  }
}
```

**Query a specific `user` by id:**

```graphql
{
  user(id: 2) {
    id
    userName
    firstName
    lastName
  }
}
```

The server returns the following response:

```json
{
  "data": {
    "user": {
      "id": 2,
      "firstName": "Kimberly",
      "lastName": "Jones",
      "userName": "kim"
    }
  }
}
```

**Query all `users`:**

```graphql
{
  users {
    userName
  }
}
```

The server returns the following response:

```json
{
  "data": {
    "users": [
      {
        "userName": "john"
      },
      {
        "userName": "kim"
      }
    ]
  }
}
```

## Implementation

The merging takes place in the [/resolvers/index.ts](./resolvers/index.ts)
and the [/typeDefs/index.ts](./typeDefs/index.ts) files.

Using this approach, you're free to structure resolver and typeDef files as you see fit.

> To avoid issues, unique naming of Queries, Mutations and Subscriptions is your responsibility.

Now you can structure by **function**...

```
+-- graphql
|   +-- resolvers
|   |   +-- user.resolvers.js/ts
|   |   +-- welcome.resolvers.js/ts
|   |   +-- index.ts  << Merges all `*.resolvers.*` files
|   +-- typeDefs
|   |   +-- user.graphql
|   |   +-- welcome.graphql
|   |   +-- index.ts  <<< Merges all `typeDef` files
```

Or by **type**...

```
+-- graphql
|   +-- entity
|   |   +-- user
|   |   |   +-- user.graphql
|   |   |   +-- user.resolvers.js/ts
|   |   +-- welcome
|   |   |   +-- welcome.graphql
|   |   |   +-- welcome.resolvers.js/ts
|   |   +-- index.ts << Merges all `*.resolvers.*` and typeDef files
```
