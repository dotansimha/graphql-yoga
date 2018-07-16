### Introduction

This example demonstrates a minimal example of using Prisma with GraphQL Yoga.

A quick look at the `prisma.yml` file shows us that we are using a demo server to run this example

The `datamodel.grapqhl` file defines the Prisma service definition.

All the code related to GraphQL-Yoga is self contained in `index.js`.

### Operations

The `typeDefs` in `index.js` suggest that we can perform the following operations. 

**Mutation:**

```graphql
mutation CreateUser {
  createUser(name: "Prisma") {
    id
    name
  }
}
```

**Query:**

```graphql
query Users {
  users {
    id
    name
  }
}
```
