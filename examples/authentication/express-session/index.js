const { GraphQLServer } = require('graphql-yoga');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const typeDefs = `
  type Query {
    isLogin: Boolean!
  }

  type Mutation {
    login(username: String!, pwd: String!): Boolean!
    signup(username: String!, pwd: String!): Boolean!
  }
`

const data = {};

const resolvers = {
  Query: {
    isLogin: (parent, args, { req }) => typeof req.session.user !== 'undefined', 
  },
  Mutation: {
    signup: async (parent, { username, pwd }, ctx) => {
      if (data[username]) {
        throw new Error('Another User with same username exists.');
      }

      data[username] = {
        pwd: await bcrypt.hashSync(pwd, 10),
      };
      
      return true;
    },
    login: async (parent, { username, pwd }, { req }) => {
      const user = data[username];
      if (user) {
        if (await bcrypt.compareSync(pwd, user.pwd)) {
          req.session.user = {
            ...user
          };
          return true;
        }

        throw new Error('Incorrect password.');
      }

      throw new Error('No Such User exists.');
    },
  }
}

