const { GraphQLServer } = require('graphql-yoga');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const ms = require('ms');

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

// opts
const opts = {
  port: 4000,
};

// context
const context = (req) => ({
  req: req.request,
});

// server
const server = new GraphQLServer({
  typeDefs,
  resolvers,
  context,
});

// session middleware
server.express.use(session({
  name: 'qid',
  secret: `some-random-secret-here`,
  resave: true,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: ms('1d'),
  },
}))

// start server
server.start(opts, () => console.log(`Server is running on http://localhost:${opts.port}`));
