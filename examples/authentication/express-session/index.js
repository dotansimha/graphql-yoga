const { GraphQLServer } = require('graphql-yoga');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const typeDefs = `
  type Query {
    isLogin: Boolean!
  }

  type Mutation {
    login(username: String!, pwd: String!): Boolean!
  }
`


