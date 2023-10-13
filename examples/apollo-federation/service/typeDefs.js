/* eslint-disable */
const { parse } = require('graphql');

module.exports = parse(/* GraphQL */ `
  type Query {
    me: User
    throw: String
  }

  type User @key(fields: "id") {
    id: ID!
    username: String
  }
`);
